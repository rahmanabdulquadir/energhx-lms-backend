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

  // ------------------------------------Get Single Course-------------------------------------
  public async getSingleCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) throw new HttpException('Course Not Found', 404);

    const result = await this.prisma.course.findUnique({
      where: { id },
      include: {
        module: true,
      },
    });
    return result;
  }

  //--------------------------------------Get All Courses------------------------------------------
  public async getAllCourses() {
    const result = await this.prisma.course.findMany();
    return result;
  }

  //---------------------------------------Update Course--------------------------------------------
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
}
