import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProgramDto, UpdateProgramDto } from './program.dto';
import { TUser } from 'src/interface/token.type';
import { UserRole } from '@prisma/client';
import adminAccessControl from 'src/utils/adminAccessControl';

export enum UserProgramStatus {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  CERTIFIED = 'CERTIFIED',
}

@Injectable()
export class ProgramService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------Create Program-------------------------------------
  public async createProgram(data: CreateProgramDto) {
    const result = await this.prisma.program.create({
      data: {
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail,
        price: data.price,
        publishedFor: data.publishedFor,
      },
    });
    const users = await this.prisma.user.findMany({
      where: { userType: data.publishedFor },
      select: { id: true },
    });
    const userProgramData = users.map((user) => ({
      userId: user.id,
      programId: result.id,
    }));

    if (userProgramData.length > 0) {
      await this.prisma.userProgram.createMany({
        data: userProgramData,
      });
    }
    return result;
  }

  // --------------------------------Get Single Program---------------------------------
  // public async getSingleProgram(id: string, user: TUser) {
  //   const program = await this.prisma.program.findUnique({
  //     where: { id },
  //   });
  //   if (!program) throw new HttpException('Program Not Found', 404);
  //   if (user.userType === UserRole.ADMIN)
  //     await adminAccessControl(this.prisma, user, program.publishedFor);
  //   if (user.userType !== 'ADMIN' && user.userType !== 'SUPER_ADMIN') {
  //     if (program.publishedFor !== user.userType)
  //       throw new HttpException(
  //         'This program is not for you to view',
  //         HttpStatus.BAD_REQUEST,
  //       );
  //   }

  //   const result = await this.prisma.program.findUnique({
  //     where: { id },
  //     include: {
  //       courses: {
  //         include: {
  //           _count: {
  //             select: {
  //               modules: true,
  //               reviews: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   return result;
  // }

  public async getSingleProgram(id: string, user: TUser) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });

    if (!program) throw new HttpException('Program Not Found', 404);

    if (user.userType === UserRole.ADMIN) {
      await adminAccessControl(this.prisma, user, program.publishedFor);
    }

    if (user.userType !== 'ADMIN' && user.userType !== 'SUPER_ADMIN') {
      if (program.publishedFor !== user.userType) {
        throw new HttpException(
          'This program is not for you to view',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Fetch full program with courses
    const result = await this.prisma.program.findUnique({
      where: { id },
      include: {
        courses: {
          include: {
            _count: {
              select: {
                modules: true,
                reviews: true,
              },
            },
          },
        },
      },
    });

    if (!result) throw new HttpException('Program not found', 404);

    // Check if user has paid (STANDARD or CERTIFIED)
    const userProgram = await this.prisma.userProgram.findUnique({
      where: {
        userId_programId: {
          userId: user.id,
          programId: result.id,
        },
      },
    });

    const hasPaid =
      userProgram?.status === UserProgramStatus.STANDARD ||
      userProgram?.status === UserProgramStatus.CERTIFIED;

    // Check which courses user completed
    const completedCourseIds = (
      await this.prisma.progress.findMany({
        where: {
          userId: user.id,
          course: { programId: result.id },
          percentage: 100,
        },
        select: { courseId: true },
      })
    ).map((c) => c.courseId);

    // Check if ALL courses are completed
    const allCompleted =
      completedCourseIds.length === result.courses.length &&
      result.courses.length > 0;

    // Assign level per course
    const coursesWithLevel = result.courses.map((course) => {
      let level: 'BASIC' | 'STANDARD' | 'CERTIFIED' = 'BASIC';

      if (hasPaid) {
        level = 'STANDARD';
        if (allCompleted) {
          level = 'CERTIFIED';
        }
      }

      return {
        ...course,
        level,
      };
    });

    return {
      ...result,
      courses: coursesWithLevel,
    };
  }

  //----------------------------------Get All Programs--------------------------------------
  public async getAllPrograms() {
    const result = await this.prisma.program.findMany();
    return result;
  }

  //----------------------------------Get My Programs--------------------------------------
  public async getMyPrograms(user: TUser) {
    // console.log('[DEBUG] Fetching user programs for:', user.id);

    const userPrograms = await this.prisma.userProgram.findMany({
      where: {
        userId: user.id,
      },
      include: {
        program: {
          include: {
            _count: {
              select: {
                courses: true,
              },
            },
          },
        },
      },
    });

    // console.log(
    //   '[DEBUG] Raw userPrograms from DB:',
    //   JSON.stringify(userPrograms, null, 2),
    // );

    const result = await Promise.all(
      userPrograms.map(async (up) => {
        let status = up.status;
        // console.log('[DEBUG] Initial status:', status);
        // console.log('[DEBUG] Payment status:', up.paymentStatus);

        if (up.paymentStatus === 'SUCCESS') {
          status = 'STANDARD';
          // console.log(
          //   '[DEBUG] Updated status to STANDARD due to payment success.',
          // );

          const courseIds = await this.prisma.course
            .findMany({
              where: { programId: up.programId },
              select: { id: true },
            })
            .then((courses) => courses.map((course) => course.id));

          // console.log('[DEBUG] Course IDs for program:', courseIds);

          const hasCertificate = await this.prisma.certificate.findFirst({
            where: {
              userId: user.id,
              courseId: { in: courseIds },
            },
          });

          // console.log('[DEBUG] Certificate found:', !!hasCertificate);

          if (hasCertificate) {
            status = 'CERTIFIED';
            // console.log(
            //   '[DEBUG] Updated status to CERTIFIED due to certificate.',
            // );
          }
        }

        // console.log(
        //   '[DEBUG] DB status:',
        //   up.status,
        //   '| Payment:',
        //   up.paymentStatus,
        // );
        // console.log('[DEBUG] Final resolved status:', status);
        return {
          status,
          program: up.program,
        };
      }),
    );
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
    // Step 1: Collect all the IDs BEFORE the transaction
    const program = await this.prisma.program.findUnique({
      where: { id },
      select: {
        id: true,
        courses: {
          select: {
            id: true,
            modules: {
              select: {
                id: true,
                contents: {
                  select: {
                    id: true,
                    quiz: {
                      select: {
                        id: true,
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

    if (!program) {
      throw new HttpException('Program not found', 404);
    }

    // Collect all the necessary IDs
    const courseIds = program.courses.map((c) => c.id);
    const moduleIds = program.courses.flatMap((c) =>
      c.modules.map((m) => m.id),
    );
    const contentIds = program.courses.flatMap((c) =>
      c.modules.flatMap((m) => m.contents.map((ct) => ct.id)),
    );
    const quizInstanceIds = program.courses.flatMap((c) =>
      c.modules.flatMap((m) =>
        m.contents.flatMap((ct) => (ct.quiz ? [ct.quiz.id] : [])),
      ),
    );

    // Step 2: Perform deletions inside transaction
    return this.prisma.$transaction(
      async (tx) => {
        // 🧹 Delete progress records BEFORE content to prevent FK constraint errors
        if (contentIds.length > 0) {
          await tx.progress.deleteMany({
            where: { contentId: { in: contentIds } },
          });
        }

        await tx.quizSubmission.deleteMany({
          where: { quizInstanceId: { in: quizInstanceIds } },
        });

        await tx.quiz.deleteMany({
          where: { quizInstanceId: { in: quizInstanceIds } },
        });

        await tx.quizInstance.deleteMany({
          where: { id: { in: quizInstanceIds } },
        });

        await tx.certificate.deleteMany({
          where: { courseId: { in: courseIds } }, // 🔥 Delete certificates before courses
        });

        await tx.content.deleteMany({
          where: { id: { in: contentIds } },
        });

        await tx.module.deleteMany({
          where: { id: { in: moduleIds } },
        });

        await tx.basicContent.deleteMany({
          where: { courseId: { in: courseIds } },
        });

        await tx.review.deleteMany({
          where: { courseId: { in: courseIds } },
        });

        // Optional: If you still want to delete progress by courseId (for safety)
        await tx.progress.deleteMany({
          where: { courseId: { in: courseIds } },
        });

        await tx.course.deleteMany({
          where: { id: { in: courseIds } },
        });

        await tx.userProgram.deleteMany({
          where: { programId: id },
        });

        await tx.program.delete({
          where: { id },
        });

        return null;
      },
      { timeout: 10000 },
    );
  }
}
