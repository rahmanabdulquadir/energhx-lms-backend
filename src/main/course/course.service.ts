import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './course.dto';
import { TUser } from 'src/interface/token.type';
import adminAccessControl from 'src/utils/adminAccessControl';
import { UserProgramStatus, UserRole } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------Create Course-------------------------------------
  public async createCourse(data: CreateCourseDto, user: TUser) {
    const program = await this.prisma.program.findUnique({
      where: { id: data.programId },
      select: {
        publishedFor: true,
      },
    });
    if (!program) throw new HttpException('Program Not Found', 404);
    if (user.userType === UserRole.ADMIN)
      await adminAccessControl(this.prisma, user, program.publishedFor);
    const course = await this.prisma.course.create({
      data,
    });
    return course;
  }

  // --------------------------------Get Single Course-----------------------------------
  public async getSingleCourse(id: string, user: TUser) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        program: {
          select: {
            publishedFor: true,
          },
        },
        programId: true,
      },
    });
  
    if (!course) throw new HttpException('Course Not Found', 404);
  
    if (user.userType === UserRole.ADMIN) {
      await adminAccessControl(this.prisma, user, course.program.publishedFor);
    }
  
    // ✅ SUPER_ADMIN access: full contents with duration
    if (user.userType === UserRole.SUPER_ADMIN) {
      const result = await this.prisma.course.findUnique({
        where: { id },
        include: {
          basicContents: true,
          modules: {
            include: {
              contents: {
                select: { videoDuration: true },
              },
            },
          },
        },
      });
  
      if (!result) throw new HttpException('Course Not Found', 404);
  
      const totalDuration = result.modules.reduce((acc, mod) => {
        const moduleDuration = mod.contents.reduce(
          (sum, content) => sum + (content.videoDuration || 0),
          0,
        );
        return acc + moduleDuration;
      }, 0);
  
      return { ...result, totalDuration };
    }
  
    // ✅ Other roles
    if (user.userType !== 'ADMIN') {
      if (course.program.publishedFor !== user.userType) {
        throw new HttpException(
          'This course is not for you to view',
          HttpStatus.BAD_REQUEST,
        );
      }
  
      const userProgram = await this.prisma.userProgram.findUnique({
        where: {
          userId_programId: {
            userId: user.id,
            programId: course.programId,
          },
        },
      });
  
      if (
        !userProgram ||
        (userProgram.status !== UserProgramStatus.STANDARD &&
          userProgram.status !== UserProgramStatus.CERTIFIED)
      ) {
        const result = await this.prisma.course.findUnique({
          where: { id },
          include: {
            basicContents: true,
          },
        });
  
        if (!result) throw new HttpException('Course Not Found', 404);
  
        return result;
      }
    }
  
    // ✅ For STANDARD or CERTIFIED users
    const result = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            contents: {
              select: { videoDuration: true },
            },
          },
        },
      },
    });
  
    if (!result) throw new HttpException('Course Not Found', 404);
  
    const totalDuration = result.modules.reduce((acc, mod) => {
      const moduleDuration = mod.contents.reduce(
        (sum, content) => sum + (content.videoDuration || 0),
        0,
      );
      return acc + moduleDuration;
    }, 0);
  
    return { ...result, totalDuration };
  }
  
  //----------------------------------Get All Courses---------------------------------------
  public async getAllCourses() {
    const courses = await this.prisma.course.findMany({
      include: {
        modules: {
          include: {
            contents: {
              select: {
                videoDuration: true,
              },
            },
          },
        },
      },
    });
  
    const resultWithDuration = courses.map((course) => {
      const totalDuration = course.modules.reduce((moduleAcc, mod) => {
        const moduleDuration = mod.contents.reduce(
          (contentAcc, content) => contentAcc + (content.videoDuration || 0),
          0,
        );
        return moduleAcc + moduleDuration;
      }, 0);
  
      // Remove modules from final output to keep it clean like your response
      const { modules, ...courseWithoutModules } = course;
  
      return {
        ...courseWithoutModules,
        totalDuration,
      };
    });
  
    return resultWithDuration;
  }
  

  //------------------------------------Update Course---------------------------------------
  public async updateCourse(id: string, data: UpdateCourseDto, user: TUser) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: {
        program: {
          select: {
            publishedFor: true,
          },
        },
      },
    });
    if (!course) throw new HttpException('Course Not Found', 404);
    if (user.userType === UserRole.ADMIN)
      await adminAccessControl(this.prisma, user, course.program.publishedFor);

    const updated = await this.prisma.course.update({
      where: { id },
      data,
    });

    return updated;
  }

  //------------------------------------Delete Course---------------------------------------
  public async deleteCourse(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id },
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
      });

      if (!course) {
        throw new HttpException('Course not found', 404);
      }

      // 1. Delete progresses
      await tx.progress.deleteMany({
        where: { courseId: id },
      });

      // 2. Delete quizzes and quiz submissions
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

      // 3. Delete reviews
      await tx.review.deleteMany({
        where: { courseId: id },
      });

      // 4. Finally, delete the course
      await tx.course.delete({
        where: { id },
      });

      return { message: 'Course and related data deleted successfully' };
    });
  }
}
