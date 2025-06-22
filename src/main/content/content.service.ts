import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './content.dto';
import { TUser } from 'src/interface/token.type';
import { UserRole } from '@prisma/client';
import adminAccessControl from 'src/utils/adminAccessControl';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  //---------------------------------------Create Content--------------------------------------------
  public async createContent(data: CreateContentDto, user: TUser) {
    const module = await this.prisma.module.findUnique({
      where: { id: data.moduleId },
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

    const Content = await this.prisma.content.create({
      data,
    });
    return Content;
  }

    // ------------------------------------ Get All Content ------------------------------------
    public async getAllContent() {
      const contents = await this.prisma.content.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          module: {
            select: {
              title: true,
              course: {
                select: {
                  title: true,
                  program: {
                    select: {
                      title: true,
                      publishedFor: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
  
      return contents;
    }

  // Get single content
public async getSingleContent(id: string, user: TUser) {
  const content = await this.prisma.content.findUnique({
    where: { id },
    include: {
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
      quiz: {
        include: {
          quizzes: true,
        },
      },
    },
  });

  if (!content) {
    throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
  }

  if (user.userType === UserRole.ADMIN) {
    await adminAccessControl(
      this.prisma,
      user,
      content.module.course.program.publishedFor,
    );
  }

  return content;
}


  //---------------------------------------Update Content--------------------------------------------
  public async updateContent(id: string, data: UpdateContentDto, user: TUser) {
    const content = await this.prisma.content.findUnique({
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
              },
            },
          },
        },
      },
    });
    if (!content) throw new HttpException('Content Not Found', 404);
    if (user.userType === UserRole.ADMIN)
      await adminAccessControl(
        this.prisma,
        user,
        content.module.course.program.publishedFor,
      );

    const updated = await this.prisma.content.update({
      where: { id },
      data,
    });

    return updated;
  }

  //---------------------------------------Delete Content--------------------------------------------
  public async deleteContent(id: string, user: TUser) {
    // Pre-check outside transaction for better performance
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
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
    });
  
    if (!content)
      throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
  
    if (user.userType === UserRole.ADMIN) {
      await adminAccessControl(
        this.prisma,
        user,
        content.module.course.program.publishedFor,
      );
    }
  
    const courseId = content.module.course.id;
  
    // Now run the rest inside a transaction with increased timeout
    return this.prisma.$transaction(async (tx) => {
      // Get all modules + content
      const modules = await tx.module.findMany({
        where: { courseId },
        include: {
          contents: {
            orderBy: { createdAt: 'asc' },
            select: { id: true },
          },
        },
      });
  
      const orderedContentIds = modules.flatMap((mod) =>
        mod.contents.map((c) => c.id),
      );
      const deletedIndex = orderedContentIds.findIndex((cid) => cid === id);
      const previousContentId = orderedContentIds[deletedIndex - 1] ?? null;
  
      // Update or delete user progress
      const progressRecords = await tx.progress.findMany({
        where: { courseId },
      });
  
      const progressOps = progressRecords.map((progress) => {
        if (progress.contentId === id) {
          if (previousContentId) {
            return tx.progress.update({
              where: { userId_courseId: { userId: progress.userId, courseId } },
              data: { contentId: previousContentId },
            });
          } else {
            return tx.progress.delete({
              where: { userId_courseId: { userId: progress.userId, courseId } },
            });
          }
        }
        return null;
      });
  
      await Promise.all(progressOps.filter(Boolean)); // filter out nulls
  
      // Delete quizzes if they exist
      const quiz = await tx.quizInstance.findUnique({
        where: { id: id }, // you might want to refactor how you fetch this ID
        include: {
          quizzes: true,
          quizSubmissions: true,
        },
      });
  
      if (quiz) {
        await tx.quizSubmission.deleteMany({
          where: { quizInstanceId: quiz.id },
        });
  
        await tx.quiz.deleteMany({
          where: { quizInstanceId: quiz.id },
        });
  
        await tx.quizInstance.delete({
          where: { id: quiz.id },
        });
      }
  
      // Finally, delete the content
      await tx.content.delete({
        where: { id },
      });
  
      return null;
    }, {
      maxWait: 10000,  // max time to wait to get a connection (10 seconds)
      timeout: 15000,  // max time for transaction to complete (15 seconds)
    });
  }
}
