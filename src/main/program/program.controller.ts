import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { IdDto } from 'src/common/id.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { CreateProgramDto, UpdateProgramDto } from './program.dto';
import { ProgramService } from './program.service';
import { Request, Response } from 'express';
import sendResponse from 'src/utils/sendResponse';

@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // Create Program
  @Post()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async createProgram(
    @Res() res: Response,
    @Body() data: CreateProgramDto,
  ) {
    const result = await this.programService.createProgram(data);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Program created successfully',
      data: result,
    });
  }

  // Get single Program
  @Get(':id')
  @UseGuards(AuthGuard)
  public async getSingleProgram(@Res() res: Response, @Param() param: IdDto) {
    const result = await this.programService.getSingleProgram(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Program retrieved successfully',
      data: result,
    });
  }

  // Get all Programs
  @Get()
  async getAllPrograms(@Res() res: Response, @Req() req: Request) {
    const result = await this.programService.getAllPrograms();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'All Programs retrieved successfully',
      data: result,
    });
  }

  // Update Program
  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async updateProgram(
    @Res() res: Response,
    @Param() param: IdDto,
    @Body() data: UpdateProgramDto,
  ) {
    const result = await this.programService.updateProgram(param.id, data);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Program updated successfully',
      data: result,
    });
  }

  // Delete Program
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async deleteProgram(@Res() res: Response, @Param() param: IdDto) {
    const result = await this.programService.deleteProgram(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Program deleted successfully',
      data: result,
    });
  }
}
