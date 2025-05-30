import { HttpException, Injectable } from '@nestjs/common';
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
}
