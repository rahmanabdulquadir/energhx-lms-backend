import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuizDto, CreateQuizResultDto, SubmitAnswerDto, UpdateQuizDto, UpdateSingleQuizDto } from './quiz.dto';
import { IdDto } from 'src/common/id.dto';
import { ApiResponse } from 'src/utils/sendResponse';
import { Quiz, QuizSubmission, UserRole } from '@prisma/client';
import { TUser } from 'src/interface/token.type';
import { PrismaService } from 'src/prisma/prisma.service';
import adminAccessControl from 'src/utils/adminAccessControl';

@Injectable()
export class QuizService {
  constructor(private readonly prisma: PrismaService) {}

  //------------------------------Get Quiz instance or Create------------------------------
  public async createQuiz(
    { contentId, quizzesData }: CreateQuizDto,
    user: TUser,
  ) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });
    
    if (!content)
      throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
    
    // ✅ Extract courseId from nested structure
    const courseId = content.module.course.id;
    if (!content)
      throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
    let quizInstance: any;
    quizInstance = await this.prisma.quizInstance.findUnique({
      where: { contentId },
      select: {
        id: true,
        content: {
          select: {
            module: {
              select: {
                course: {
                  select: {
                    program: {
                      select: {
                        publishedFor: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (quizInstance && user.userType === UserRole.ADMIN)
      await adminAccessControl(
        this.prisma,
        user,
        quizInstance.content.module.course.program.publishedFor,
      );

    if (!quizInstance) {
      quizInstance = await this.prisma.quizInstance.create({
        data: {
          contentId,
          totalMark: quizzesData.length,
          courseId
        },
      });
    }

    const formattedData = quizzesData.map((quiz) => ({
      question: quiz.question,
      options: quiz.options,
      correctAnswer: quiz.correctAnswer,
      quizInstanceId: quizInstance.id,
    }));

    await this.prisma.quiz.createMany({
      data: formattedData,
    });

    const result = await this.prisma.quizInstance.findUnique({
      where: { contentId },
      include: {
        quizzes: true,
      },
    });
    return result;
  }

  // ------------------------------ Get all quizzes ---------------------------------
  public async getAllQuizzes(contentId: string, user: TUser) {
    const quizContent = await this.prisma.quizInstance.findUnique({
      where: { contentId },
      include: {
        quizzes: true,
        content: {
          select: {
            module: {
              select: {
                course: {
                  select: {
                    program: {
                      select: {
                        publishedFor: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!quizContent?.quizzes || !quizContent.quizzes.length)
      throw new HttpException('No quizzes found!', HttpStatus.NOT_FOUND);
    if (user.userType === UserRole.ADMIN)
      await adminAccessControl(
        this.prisma,
        user,
        quizContent.content.module.course.program.publishedFor,
      );
    const result = await this.prisma.quizInstance.findUnique({
      where: { contentId },
      include: {
        quizzes: true,
      },
    });
    return result;
  }

  // ------------------------------Start Quiz-------------------------------------
  public async startQuiz(id: string, user: TUser) {
    const quizContent = await this.prisma.content.findUnique({
      where: { id },
      select: {
        module: {
          select: {
            course: {
              select: {
                program: {
                  select: {
                    publishedFor: true,
                  },
                },
                programId: true,
              },
            },
          },
        },
        quiz: {
          select: {
            quizzes: {
              select: {
                id: true,
                question: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!quizContent?.quiz?.quizzes || !quizContent?.quiz.quizzes.length)
      throw new HttpException('No quizzes found!', HttpStatus.NOT_FOUND);
    if (quizContent?.module.course.program.publishedFor !== user.userType)
      throw new HttpException(
        'This quiz is not for you to view',
        HttpStatus.BAD_REQUEST,
      );
    const paymentStatus = await this.prisma.userProgram.findUnique({
      where: {
        userId_programId: {
          userId: user.id,
          programId: quizContent?.module.course?.programId,
        },
      },
    });
    if (!paymentStatus)
      throw new HttpException(
        'You need to pay first to view the quiz',
        HttpStatus.BAD_REQUEST,
      );
    return quizContent.quiz.quizzes;
  }

  //----------------------------------Submit Quiz-------------------------------------------
  public async submitQuiz(
    { answerSheet, contentId }: SubmitAnswerDto,
    user: TUser,
  ) {
    // Check if the content exists
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
      select: {
        quiz: true,
        module: {
          select: {
            course: {
              select: {
                program: {
                  select: {
                    publishedFor: true,
                  },
                },
                programId: true,
              },
            },
          },
        },
      },
    });
    if (!content)
      throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
    if (content.module.course.program.publishedFor !== user.userType)
      throw new HttpException(
        'This quiz is not for you to submit!',
        HttpStatus.BAD_REQUEST,
      );
    const paymentStatus = await this.prisma.userProgram.findUnique({
      where: {
        userId_programId: {
          userId: user.id,
          programId: content?.module.course?.programId,
        },
      },
    });
    if (!paymentStatus)
      throw new HttpException(
        'You need to pay first to view the quiz',
        HttpStatus.BAD_REQUEST,
      );
    // Check if the student is enrolled in the course
    const subscribedUser = await this.prisma.user.findUnique({
      where: { id: user.id, status: 'ACTIVE' }, // TODO: ADD CHECKING IF THE USER HAS DONE PAYMENT FOR THE PROGRAM AND IF THE PROGRAM'S PUBLISHEDFOR MATHCHES THE USER'S USERTYPE
    });
    if (!subscribedUser) {
      throw new HttpException(
        'User not found or not enrolled in the course!',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if the quiz instance exists
    const quizInstance = await this.prisma.quizInstance.findUnique({
      where: { contentId },
      include: { quizzes: true },
    });
    if (!quizInstance) {
      throw new HttpException('Quiz instance not found', HttpStatus.NOT_FOUND);
    }

    // Check if the student has already submitted the quiz
    const existingSubmission = await this.prisma.quizSubmission.findFirst({
      where: {
        quizInstanceId: quizInstance.id,
        userId: subscribedUser.id,
      },
    });
    if (existingSubmission) {
      throw new HttpException('Quiz already submitted', HttpStatus.BAD_REQUEST);
    }

    // Calculate correct and incorrect answers
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    for (const quiz of quizInstance.quizzes) {
      const userAnswer = answerSheet.find((ans) => ans.quizId === quiz.id);
      if (userAnswer && userAnswer.answer === quiz.correctAnswer)
        correctAnswers++;
      else incorrectAnswers++;
    }

    // Create the quiz submission
    const quizSubmission = await this.prisma.quizSubmission.create({
      data: {
        quizInstanceId: quizInstance.id,
        userId: subscribedUser.id,
        correctAnswers,
        incorrectAnswers,
        isCompleted: true,
      },
    });

    return {
      quizSubmission,
      score: correctAnswers,
      total: quizInstance.quizzes.length,
    };
  }

  // ------------------------------Delete Single Quiz-------------------------------------
  public async deleteQuiz(id: string, user: TUser) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      select: {
        quizInstance: {
          select: {
            content: {
              select: {
                module: {
                  select: {
                    course: {
                      select: {
                        program: {
                          select: {
                            publishedFor: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!quiz) throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    if (user.userType === UserRole.ADMIN)
      await adminAccessControl(
        this.prisma,
        user,
        quiz.quizInstance.content.module.course.program.publishedFor,
      );
    await this.prisma.quiz.delete({
      where: { id },
    });
    return null;
  }

  public async updateQuiz(id: string, dto: UpdateSingleQuizDto, user: TUser) {
    // Validate that update data is present
    if (!dto || Object.keys(dto).length === 0) {
      throw new HttpException('No quiz data provided', HttpStatus.BAD_REQUEST);
    }
  
    // Fetch the existing quiz to check existence and permission
    const existingQuiz = await this.prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        quizInstance: {
          select: {
            content: {
              select: {
                module: {
                  select: {
                    course: {
                      select: {
                        program: {
                          select: {
                            publishedFor: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  
    if (!existingQuiz) {
      throw new HttpException('Quiz not found', HttpStatus.NOT_FOUND);
    }
  
    // Admin access control check if applicable
    if (user.userType === UserRole.ADMIN) {
      await adminAccessControl(
        this.prisma,
        user,
        existingQuiz.quizInstance.content.module.course.program.publishedFor,
      );
    }
  
    // Update only provided fields
    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      data: {
        ...(dto.question !== undefined && { question: dto.question }),
        ...(dto.options !== undefined && { options: dto.options }),
        ...(dto.correctAnswer !== undefined && { correctAnswer: dto.correctAnswer }),
      },
    });
  
    return updatedQuiz;
  }

async getQuizResult(user: any) {
  const latestSubmission = await this.prisma.quizSubmission.findFirst({
    where: {
      userId: user.id,
      isCompleted: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!latestSubmission) {
    throw new NotFoundException('No completed quiz found for this user');
  }

  const total = latestSubmission.correctAnswers + latestSubmission.incorrectAnswers;

  return {
    quizSubmission: latestSubmission,
    score: latestSubmission.correctAnswers,
    total,
  };
}

}
