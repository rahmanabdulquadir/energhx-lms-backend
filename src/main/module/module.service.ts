import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto } from './module.dto';
import { TUser } from 'src/interface/token.type';
import adminAccessControl from 'src/utils/adminAccessControl';
import { UserRole } from '@prisma/client';

@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------Create Module-------------------------------------
  public async createModule(data: CreateModuleDto, user: TUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
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
    const Module = await this.prisma.module.create({
      data,
    });
    return Module;
  }

  // ------------------------------------Get Single Module-------------------------------------
  public async getSingleModule(id: string, user: TUser) {
    // Step 1: Validate access & get course ID
    const module = await this.prisma.module.findUnique({
      where: { id },
      select: {
        course: {
          select: {
            program: {
              select: {
                publishedFor: true,
              },
            },
            programId: true,
            id: true, // needed for courseId
          },
        },
      },
    });
  
    if (!module) throw new HttpException('Module Not Found', 404);
  
    if (user.userType !== 'ADMIN' && user.userType !== 'SUPER_ADMIN') {
      if (module.course.program.publishedFor !== user.userType) {
        throw new HttpException(
          'This course is not for you to view',
          HttpStatus.BAD_REQUEST,
        );
      }
  
      const paymentStatus = await this.prisma.userProgram.findUnique({
        where: {
          userId_programId: {
            userId: user.id,
            programId: module.course.programId,
          },
        },
      });
  
      if (!paymentStatus) {
        throw new HttpException(
          'You need to pay first to view the course',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  
    // Step 2: Retrieve module with contents including duration
    const result = await this.prisma.module.findUnique({
      where: { id },
      include: {
        contents: {
          select: {
            id: true,
            title: true,
            videoDuration: true,
            // add more fields if needed
          },
        },
      },
    });
  
    if (!result) {
      throw new HttpException('Module Not Found', 404);
    }
  
    // Step 3: Inject courseId into each content
    const contentsWithCourseId = result.contents.map((content) => ({
      ...content,
      courseId: module.course.id,
    }));
  
    // Step 4: Calculate total duration
    const totalDuration = contentsWithCourseId.reduce(
      (sum, content) => sum + (content.videoDuration || 0),
      0,
    );
  
    return {
      ...result,
      courseId: module.course.id,
      contents: contentsWithCourseId,
      totalDuration, // ⏱️ total duration in minutes/seconds
    };
  }
  //----------------------------------Get All Modules---------------------------------------
  public async getAllModules(courseId: string) {
    const modules = await this.prisma.module.findMany({
      where: { courseId },
      include: {
        contents: {
          select: {
            videoDuration: true,
          },
        },
      },
    });
  
    if (!modules || modules.length === 0) {
      throw new HttpException('No Module Found for this course!', 404);
    }
  
    const enhancedModules = modules.map((module) => {
      const totalDuration = module.contents.reduce(
        (sum, content) => sum + (content.videoDuration || 0),
        0,
      );
      const { contents, ...rest } = module;
      return {
        ...rest,
        totalDuration, // ⏱️ total duration in minutes or seconds
      };
    });
  
    return enhancedModules;
  }
  
  //---------------------------------------Update Module--------------------------------------------
  public async updateModule(id: string, data: UpdateModuleDto, user: TUser) {
    const module = await this.prisma.module.findUnique({
      where: { id },
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
    });
    if (!module) throw new HttpException('Module Not Found', 404);
    if (user.userType === UserRole.ADMIN)
      await adminAccessControl(
        this.prisma,
        user,
        module.course.program.publishedFor,
      );
    const updated = await this.prisma.module.update({
      where: { id },
      data,
    });

    return updated;
  }
  //---------------------------------------Delete Module--------------------------------------------
  public async deleteModule(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const module = await tx.module.findUnique({
        where: { id },
        include: {
          course: true,
          contents: {
            orderBy: { createdAt: 'asc' },
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
      });

      if (!module) throw new HttpException('Module not found', 404);

      const courseId = module.course.id;

      // Get all modules of the course
      const allModules = await tx.module.findMany({
        where: { courseId },
        orderBy: { createdAt: 'asc' },
        include: {
          contents: {
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          },
        },
      });

      // Flatten content IDs in order
      const allContentIds: string[] = [];
      let previousContentId: string | null = null;
      for (let i = 0; i < allModules.length; i++) {
        if (allModules[i].id === id) break;
        const moduleContents = allModules[i].contents.map((c) => c.id);
        if (moduleContents.length > 0) {
          previousContentId = moduleContents[moduleContents.length - 1];
          allContentIds.push(...moduleContents);
        }
      }

      const contentIdsToDelete = new Set(module.contents.map((c) => c.id));

      const progressRecords = await tx.progress.findMany({
        where: { courseId },
      });

      for (const progress of progressRecords) {
        if (contentIdsToDelete.has(progress.contentId)) {
          if (previousContentId) {
            await tx.progress.update({
              where: { userId_courseId: { userId: progress.userId, courseId } },
              data: { contentId: previousContentId },
            });
          } else {
            await tx.progress.delete({
              where: { userId_courseId: { userId: progress.userId, courseId } },
            });
          }
        }
      }

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
        where: { id },
      });

      return null;
    });
  }
}
