import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './course.dto';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------Create Course-------------------------------------
  public async createCourse(data: CreateCourseDto) {
    const program = await this.prisma.program.findUnique({
      where: { id: data.programId },
    });
    if (!program) throw new HttpException('Program Not Found', 404);

    const course = await this.prisma.course.create({
      data,
    });
    return course;
  }

  // --------------------------------Get Single Course-----------------------------------
  public async getSingleCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id }, // TODO: ADD CHECKING IF THE USER HAS DONE PAYMENT FOR THE PROGRAM AND IF THE PROGRAM'S PUBLISHEDFOR MATHCHES THE USER'S USERTYPE
    });
    if (!course) throw new HttpException('Course Not Found', 404);

    const result = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: true,
      },
    });
    return result;
  }

  //----------------------------------Get All Courses---------------------------------------
  public async getAllCourses() {
    const result = await this.prisma.course.findMany();
    return result;
  }

  //------------------------------------Update Course---------------------------------------
  public async updateCourse(id: string, data: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) throw new HttpException('Course Not Found', 404);

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
