import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DeveloperProfileDto } from './developer.dto';

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------- Create Developer --------------------------------
  public async createDeveloper(payload: DeveloperProfileDto) {
    const newDeveloper = await this.prisma.developer.create({
      data: payload,
    });
    return newDeveloper;
  }
}
