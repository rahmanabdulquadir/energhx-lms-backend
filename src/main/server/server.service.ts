import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProfileDto } from '../developer/developer.dto';

@Injectable()
export class ServerService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------- Create Server Profile --------------------------------
  public async createServerProfile(id: string, payload: CreateProfileDto) {
    const existingServer = await this.prisma.server.findUnique({
      where: { id },
    });
    if (!existingServer)
      throw new HttpException('Server not found!', HttpStatus.NOT_FOUND);
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
          serverId: id,
          document: ref.document as string,
        })),
      });
    }

    // 2. Create Publications if any
    if (publications?.length) {
      await this.prisma.publication.createMany({
        data: publications.map((pub) => ({
          ...pub,
          serverId: id,
        })),
      });
    }

    // 3. Create Experiences if any
    if (experiences?.length) {
      await this.prisma.experience.createMany({
        data: experiences.map((exp) => ({
          ...exp,
          serverId: id,
        })),
      });
    }

    const updatedServer = await this.prisma.server.findUnique({
      where: { id },
      include: {
        experiences: true,
        references: true,
        publications: true,
      },
    });
    return updatedServer;
  }

  // -------------------------------- Get Single Server --------------------------------
  public async getASingleServer(id: string) {
    const existingServer = await this.prisma.server.findUnique({
      where: { id },
      include: {
        experiences: true,
        references: true,
        publications: true,
      },
    });
    if (!existingServer)
      throw new HttpException('Server not found!', HttpStatus.NOT_FOUND);
    return existingServer;
  }

  // -------------------------------- Get All Servers --------------------------------
  public async getAllServersFromDB() {
    const servers = await this.prisma.server.findMany({
      include: {
        experiences: true,
        references: true,
        publications: true,
      },
    });
    if (!servers || servers.length === 0)
      throw new HttpException('No servers found!', HttpStatus.NOT_FOUND);
    return servers;
  }
}
