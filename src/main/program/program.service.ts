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

  // ------------------------------------Get Single Program-------------------------------------
  public async getSingleProgram(id: string) {
    const result = await this.prisma.program.findUnique({
      where: { id },
    });
    return result;
  }

  //--------------------------------------Get All Programs------------------------------------------
  public async getAllPrograms() {
    const result = await this.prisma.program.findMany();
    return result;
  }

  //---------------------------------------Update Program--------------------------------------------
  public async updateProgram(id: IdDto, data: UpdateProgramDto) {
    const Program = await this.prisma.program.findUnique({
      where: id,
    });
    if (!Program) throw new HttpException('Program Not Found', 404);

    const updated = await this.prisma.program.update({
      where: id,
      data,
    });

    return {
      success: true,
      message: 'Program updated successfully',
      statusCode: HttpStatus.OK,
      data: updated,
    };
  }

  //-------------------------------------Delete Program-----------------------------------------
  public async deleteProgram(ProgramId: string) {
    return {
      statusCode: 200,
      success: true,
      message: 'Program deleted successfully',
      data: null,
    };
  }
}
