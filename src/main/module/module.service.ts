import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto } from './module.dto';

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
      where: { id },
    });
    if (!module) throw new HttpException('Module Not Found', 404);

    const result = await this.prisma.module.findUnique({
      where: { id },
      include: {
        content: true,
      },
    });
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
}
