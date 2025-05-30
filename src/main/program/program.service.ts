import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IdDto } from 'src/common/id.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProgramDto, UpdateProgramDto } from './program.dto';

@Injectable()
export class ProgramService {
  constructor(private prisma: PrismaService) {}
  // ------------------------------Create Program-------------------------------------
  public async createProgram(data: CreateProgramDto) {
    const result = await this.prisma.program.create({
      data,
    });
    return result;
  }

  // --------------------------------Get Single Program---------------------------------
  public async getSingleProgram(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });
    if (!program) throw new HttpException('Program Not Found', 404);

    const result = await this.prisma.program.findUnique({
      where: { id }, // TODO: ADD CHECKING IF THE USER HAS DONE PAYMENT FOR THE PROGRAM AND IF THE PROGRAM'S PUBLISHEDFOR MATHCHES THE USER'S USERTYPE
      include: {
        course: true,
      },
    });
    return result;
  }

  //----------------------------------Get All Programs--------------------------------------
  public async getAllPrograms() {
    const result = await this.prisma.program.findMany();
    return result;
  }

  //-------------------------------------Update Program------------------------------------
  public async updateProgram(id: string, data: UpdateProgramDto) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });
    if (!program) throw new HttpException('Program Not Found', 404);

    const result = await this.prisma.program.update({
      where: { id },
      data,
    });
    return result;
  }

  //--------------------------------Delete Program--------------------------------------
  public async deleteProgram(id: string) {
    const program = await this.prisma.program.findUnique({
      where: { id },
    });
    if (!program) throw new HttpException('Program Not Found', 404);
    const result = await this.prisma.program.delete({
      where: { id },
    });
    return result;
  }
}
