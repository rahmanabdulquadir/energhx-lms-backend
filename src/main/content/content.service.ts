import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  //---------------------------------------Create Content--------------------------------------------
  public async createContent(data: CreateContentDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: data.moduleId },
    });
    if (!module) throw new HttpException('Module Not Found', 404);

    const Content = await this.prisma.content.create({
      data,
    });
    return Content;
  }

  //---------------------------------------Update Content--------------------------------------------
  public async updateContent(id: string, data: UpdateContentDto) {
    const Content = await this.prisma.content.findUnique({
      where: { id },
    });
    if (!Content) throw new HttpException('Content Not Found', 404);

    const updated = await this.prisma.content.update({
      where: { id },
      data,
    });

    return updated;
  }

  //---------------------------------------Delete Content--------------------------------------------
  public async deleteContent(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const content = await tx.content.findUnique({
        where: { id },
        include: {
          module: {
            include: {
              course: true,
              contents: {
                orderBy: { createdAt: 'asc' },
                select: { id: true },
              },
            },
          },
          quiz: {
            include: {
              quizzes: true,
              quizSubmissions: true,
            },
          },
        },
      });
  
      if (!content)
        throw new HttpException('Content not found', HttpStatus.NOT_FOUND);
  
      const courseId = content.module.course.id;
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
  
      const progressRecords = await tx.progress.findMany({
        where: { courseId },
      });
  
      for (const progress of progressRecords) {
        if (progress.contentId === id) {
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
        where: { id },
      });
  
      return null;
    });
  }
  
}
