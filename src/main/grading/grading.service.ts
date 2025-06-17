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

    return await this.prisma.quizSubmission.create({
      data: {
        userId: dto.userId,
        quizInstanceId: dto.quizInstanceId,
        correctAnswers: dto.correctAnswers,
        incorrectAnswers: dto.incorrectAnswers,
        isCompleted: dto.isCompleted,
      },
    });
  }

  async getCourseAveragePercentage(userId: string, courseId: string): Promise<number> {
    const submissions = await this.prisma.quizSubmission.findMany({
      where: {
        userId,
        isCompleted: true,
        quizInstance: {
          is: {
            courseId: courseId,
          },
        },
      },
      include: {
        quizInstance: true,
      },
    });

    if (!submissions.length) return 0;

    const percentages = submissions.map(sub => {
      const total = (sub.quizInstance as any).totalQuestions;
      return total > 0 ? (sub.correctAnswers / total) * 100 : 0;
    });

    const avg = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    return parseFloat(avg.toFixed(2));
  }

  async issueCertificate(userId: string, courseId: string) {
    const average = await this.getCourseAveragePercentage(userId, courseId);

    if (average < 60) {
      throw new BadRequestException('User has not passed the course.');
    }

    const existing = await this.prisma.certificate.findFirst({
      where: { userId, courseId },
    });

    if (existing) return existing;

    return this.prisma.certificate.create({
      data: { userId, courseId, average },
    });
  }

  async getCertificate(userId: string, courseId: string) {
    return this.prisma.certificate.findFirst({
      where: { userId, courseId },
    });
  }
}
