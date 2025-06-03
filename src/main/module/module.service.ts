import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto } from './module.dto';
import { TUser } from 'src/interface/token.type';

@Injectable()
export class ModuleService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------Create Module-------------------------------------
  public async createModule(data: CreateModuleDto) {
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
    });
    if (!course) throw new HttpException('Course Not Found', 404);

    const Module = await this.prisma.module.create({
      data,
    });
    return Module;
  }

  // ------------------------------------Get Single Module-------------------------------------
  public async getSingleModule(id: string) {
    const module = await this.prisma.module.findUnique({
      where: { id }, // TODO: ADD CHECKING IF THE USER HAS DONE PAYMENT FOR THE PROGRAM AND IF THE PROGRAM'S PUBLISHEDFOR MATHCHES THE USER'S USERTYPE
    });
    if (!module) throw new HttpException('Module Not Found', 404);

    const result = await this.prisma.module.findUnique({
      where: { id },
      include: {
        contents: true,
      },
    });
    return result;
  }

  //----------------------------------Get All Modules---------------------------------------
  public async getAllModules(courseId: string) {
    const result = await this.prisma.module.findMany({
      where: { courseId },
    });
    if (!result)
      throw new HttpException('No Module Found for this course!', 404);
    return result;
  }

  //---------------------------------------Update Module--------------------------------------------
  public async updateModule(id: string, data: UpdateModuleDto) {
    const module = await this.prisma.module.findUnique({
      where: { id },
    });
    if (!module) throw new HttpException('Module Not Found', 404);

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
