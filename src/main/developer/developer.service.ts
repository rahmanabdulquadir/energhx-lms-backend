import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProfileDto } from './developer.dto';

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------- Create Developer --------------------------------
  public async createDeveloper(id: string, payload: CreateProfileDto) {
    const existingDeveloper = await this.prisma.developer.findUnique({
      where: { id },
    });
    if (!existingDeveloper)
      throw new HttpException('Developer not found!', HttpStatus.NOT_FOUND);
    const { reference, publications, experiences } = payload;

    // 1. Create Reference if it exists
    if (reference?.length) {
      for (const ref of reference) {
        if (!ref.document) {
          throw new HttpException(
            `You must provide document for ${ref.name}!`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      await this.prisma.reference.createMany({
        data: reference.map((ref) => ({
          ...ref,
          developerId: id,
          document: ref.document as string,
        })),
      });
    }

    // 2. Create Publications if any
    if (publications?.length) {
      // console.log('Publications -> ', publications);
      await this.prisma.publication.createMany({
        data: publications.map((pub) => ({
          ...pub,
          developerId: id,
        })),
      });
    }

    // 3. Create Experiences if any
    if (experiences?.length) {
      await this.prisma.experience.createMany({
        data: experiences.map((exp) => ({
          ...exp,
          developerId: id,
        })),
      });
    }
    const updatedDeveloper = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        experiences: true,
        references: true,
        publications: true,
      },
    });
    return updatedDeveloper;
  }

  public async getASingleDeveloper(id: string) {
    const existingDeveloper = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        experiences: true,
        references: true,
        publications: true,
      },
    });
    if (!existingDeveloper)
      throw new HttpException('Developer not found!', HttpStatus.NOT_FOUND);
    return existingDeveloper;
  }

  public async getAllDevelopersFromDB() {
    const existingDeveloper = await this.prisma.developer.findMany({
      include: {
        experiences: true,
        references: true,
        publications: true,
      },
    });
    if (!existingDeveloper || existingDeveloper.length == 0)
      throw new HttpException('Developer not found!', HttpStatus.NOT_FOUND);
    return existingDeveloper;
  }
}
