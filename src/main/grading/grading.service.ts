import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuizSubmissionDto } from './dto/create-quiz-submission.dto';

@Injectable()
export class GradingService {
  constructor(private prisma: PrismaService) {}

  async submitQuiz(dto: CreateQuizSubmissionDto) {
    const quizInstance = await this.prisma.quizInstance.findUnique({
      where: { id: dto.quizInstanceId },
    });

    if (!quizInstance) {
      throw new BadRequestException('Invalid quizInstanceId');
    }

    return this.prisma.quizSubmission.create({
      data: {
        userId: dto.userId,
        quizInstanceId: dto.quizInstanceId,
        correctAnswers: dto.correctAnswers,
        incorrectAnswers: dto.incorrectAnswers,
        isCompleted: dto.isCompleted,
      },
    });
  }

  async getCourseAveragePercentage(
    userId: string,
    courseId: string,
  ): Promise<number> {
    console.log(
      `📘 Fetching quiz submissions for userId=${userId}, courseId=${courseId}`,
    );

    const submissions = await this.prisma.quizSubmission.findMany({
      where: {
        userId,
        isCompleted: true,
        quizInstance: {
          content: {
            module: {
              courseId,
            },
          },
        },
      },
      include: {
        quizInstance: {
          include: {
            content: {
              include: {
                module: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    console.log(`✅ Found ${submissions.length} completed quiz submissions`);

    if (!submissions.length) return 0;

    const percentages = submissions.map((sub, index) => {
      const total = sub.quizInstance.totalMark ?? 0;
      const score = total > 0 ? (sub.correctAnswers / total) * 100 : 0;
      console.log(
        `📊 Submission ${index + 1}: correct=${sub.correctAnswers}, total=${total}, score=${score.toFixed(2)}%`,
      );
      return score;
    });

    const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    console.log(`🎯 Average score: ${avg.toFixed(2)}%`);

    return parseFloat(avg.toFixed(2));
  }

  async issueCertificate(userId: string, courseId: string) {
    console.log(
      `🏅 Attempting to issue certificate for userId=${userId}, courseId=${courseId}`,
    );

    const average = await this.getCourseAveragePercentage(userId, courseId);

    if (average < 33) {
      console.log(`⛔️ User failed with average: ${average.toFixed(2)}%`);
      throw new BadRequestException('User has not passed the course.');
    }

    const existing = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) {
      console.log('📄 Existing certificate found. Returning...');
      return existing;
    }

    const newCertificate = await this.prisma.certificate.create({
      data: {
        userId,
        courseId,
        average,
      },
    });

    console.log('✅ Certificate issued successfully');
    return newCertificate;
  }

  async getCertificate(userId: string, courseId: string) {
    return this.prisma.certificate.findFirst({
      where: { userId, courseId },
    });
  }

  async getUserResultsForCourse(userId: string, courseId: string) {
    const submissions = await this.prisma.quizSubmission.findMany({
      where: {
        userId,
        quizInstance: {
          content: {
            module: {
              courseId,
            },
          },
        },
      },
      include: {
        quizInstance: {
          include: {
            content: {
              select: {
                title: true,
                contentType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return submissions.map((submission) => ({
      contentTitle: submission.quizInstance.content.title,
      contentType: submission.quizInstance.content.contentType,
      correctAnswers: submission.correctAnswers,
      incorrectAnswers: submission.incorrectAnswers,
      isCompleted: submission.isCompleted,
      createdAt: submission.createdAt,
    }));
  }
}
