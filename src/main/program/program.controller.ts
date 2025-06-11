import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
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
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LibService } from 'src/lib/lib.service';

@Controller('program')
export class ProgramController {
  constructor(
    private readonly programService: ProgramService,
    private readonly lib: LibService,
  ) {}

  // Create Program
  @Post()
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  public async createProgram(
    @Res() res: Response,
    @Body('text') text: string, // this is the JSON string from "text"
    @UploadedFile() file: any,
  ) {
    const parsed = JSON.parse(text);
    const createProgramDto = plainToInstance(CreateProgramDto, parsed);

    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        createProgramDto.thumbnail = uploaded.secure_url;
      }
    }
    const errors = await validate(createProgramDto);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          Object.values(errors[0].constraints || {})[0] || 'Validation failed',
        errorDetails: errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        })),
      });
    }
    const result = await this.programService.createProgram(createProgramDto);
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
  public async getSingleProgram(
    @Res() res: Response,
    @Param() param: IdDto,
    @Req() req: Request,
  ) {
    const result = await this.programService.getSingleProgram(
      param.id,
      req.user,
    );
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
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  public async updateProgram(
    @Res() res: Response,
    @Param() param: IdDto,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    let updateProgramDto: any = {};
    if (!text && !file) {
      throw new HttpException(
        'No data provided for update',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (text) {
      const parsed = JSON.parse(text);
      updateProgramDto = plainToInstance(UpdateProgramDto, parsed);
    }

    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        updateProgramDto.thumbnail = uploaded.secure_url;
      }
    }
    await validate(updateProgramDto);
    console.log('updateProgramDto ==> ', updateProgramDto);

    const result = await this.programService.updateProgram(
      param.id,
      updateProgramDto,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Program updated successfully',
      data: result,
    });
  }

  // Delete Program
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
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
