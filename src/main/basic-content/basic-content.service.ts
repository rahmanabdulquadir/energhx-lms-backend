import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CreateBasicContentDto,
  UpdateBasicContentDto,
} from './basic-content.dto';
import { TUser } from 'src/interface/token.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import adminAccessControl from 'src/utils/adminAccessControl';

@Injectable()
export class BasicContentService {
  constructor(private prisma: PrismaService) {}
  //---------------------------------------Create Basic Content--------------------------------------------
  public async createBasicContent(data: CreateBasicContentDto, user: TUser) {
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

    const basicContent = await this.prisma.basicContent.create({
      data,
    });
    return basicContent;
  }


  public async getAllBasicContent() {
    const allContent = await this.prisma.basicContent.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
    });
  
    return allContent;
  }
  //---------------------------------------Update Basic Content--------------------------------------------
  public async updateBasicContent(
    id: string,
    data: UpdateBasicContentDto,
    user: TUser,
  ) {
    const basicContent = await this.prisma.basicContent.findUnique({
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
    if (!basicContent) throw new HttpException('Basic Content Not Found', 404);
    if (user.userType === UserRole.ADMIN)
      await adminAccessControl(
        this.prisma,
        user,
        basicContent.course.program.publishedFor,
      );

    const updated = await this.prisma.basicContent.update({
      where: { id },
      data,
    });

    return updated;
  }

  //---------------------------------------Delete Content--------------------------------------------
  public async deleteBasicContent(id: string, user: TUser) {
    return this.prisma.$transaction(async (tx) => {
      const basicContent = await tx.basicContent.findUnique({
        where: { id },
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
      });

      if (!basicContent)
        throw new HttpException(
          'Basic content not found',
          HttpStatus.NOT_FOUND,
        );
      if (user.userType === UserRole.ADMIN)
        await adminAccessControl(
          this.prisma,
          user,
          basicContent.course.program.publishedFor,
        );
      return null;
    });
  }
}
