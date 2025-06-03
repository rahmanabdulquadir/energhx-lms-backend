import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IdDto } from 'src/common/id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProgramDto, UpdateProgramDto } from './program.dto';
import { TUser } from 'src/interface/token.type';

@Injectable()
export class ProgramService {
  constructor(private prisma: PrismaService) {}
  // ------------------------------Create Program-------------------------------------
  public async createProgram(data: CreateProgramDto) {
    const result = await this.prisma.program.create({
      data,
    });
    return result;
  }

  // --------------------------------Get Single Program---------------------------------
  public async getSingleProgram(id: string, user: TUser) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });
    if (!program) throw new HttpException('Program Not Found', 404);
    if (user.userType !== 'ADMIN') {
      if (program.publishedFor !== user.userType)
        throw new HttpException(
          'This program is not for you to view',
          HttpStatus.BAD_REQUEST,
        );
      const paymentStatus = await this.prisma.userProgram.findUnique({
        where: {
          userId_programId: {
            userId: user.id,
            programId: program.id,
          },
        },
      });
      if (!paymentStatus)
        throw new HttpException(
          'You need to pay first to view the program',
          HttpStatus.BAD_REQUEST,
        );
    }

    const result = await this.prisma.program.findUnique({
      where: { id },
      include: {
        courses: true,
      },
    });
    return result;
  }

  //----------------------------------Get All Programs--------------------------------------
  public async getAllPrograms() {
    const result = await this.prisma.program.findMany();
    return result;
  }

  //-------------------------------------Update Program------------------------------------
  public async updateProgram(id: string, data: UpdateProgramDto) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });
    if (!program) throw new HttpException('Program Not Found', 404);

    const result = await this.prisma.program.update({
      where: { id },
      data,
    });
    return result;
  }

  //--------------------------------Delete Program--------------------------------------
  public async deleteProgram(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const program = await tx.program.findUnique({
        where: { id },
        include: {
          courses: {
            include: {
              modules: {
                include: {
                  contents: {
                    include: {
                      quiz: {
                        include: {
                          quizzes: true,
                          quizSubmissions: true,
                        },
                      },
                    },
                  },
                },
              },
              reviews: true,
              progresses: true,
            },
          },
          enrolledUsers: true,
        },
      });

      if (!program) {
        throw new HttpException('Program not found', 404);
      }

      for (const course of program.courses) {
        for (const module of course.modules) {
          for (const content of module.contents) {
            if (content.quiz) {
              await tx.quizSubmission.deleteMany({
                where: { quizInstanceId: content.quiz.id },
              });

              await tx.quiz.deleteMany({
                where: { quizInstanceId: content.quiz.id },
              });

              await tx.quizInstance.delete({
                where: { id: content.quiz.id },
              });
            }

            await tx.content.delete({
              where: { id: content.id },
            });
          }

          await tx.module.delete({
            where: { id: module.id },
          });
        }

        await tx.review.deleteMany({
          where: { courseId: course.id },
        });

        await tx.progress.deleteMany({
          where: { courseId: course.id },
        });

        await tx.course.delete({
          where: { id: course.id },
        });
      }

      await tx.userProgram.deleteMany({
        where: { programId: id },
      });

      await tx.program.delete({
        where: { id },
      });

      return null;
    });
  }
}
