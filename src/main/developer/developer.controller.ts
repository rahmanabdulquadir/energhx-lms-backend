import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import sendResponse from 'src/utils/sendResponse';
import { DeveloperService } from './developer.service';
import { Request, Response } from 'express';
import { CreateProfileDto } from './developer.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LibService } from 'src/lib/lib.service';
import { UploadInterceptor } from 'src/common/upload.interceptor';

@Controller('developer')
export class DeveloperController {
  constructor(
    private readonly developerService: DeveloperService,
    private readonly lib: LibService,
  ) {}

  // Create Developer Profile
  @Post('/profile/:id')
  @UploadInterceptor('files', 10)
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER]))
  async createDeveloper(
    @Body('text') text: string,
    @UploadedFiles() files: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let developerProfileDto: any;
    const parsed = JSON.parse(text);
    developerProfileDto = plainToInstance(CreateProfileDto, parsed);

    const errors = await validate(developerProfileDto);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.map((err) => ({
          property: err.property,
          constraints: err.constraints,
        })),
      });
    }
    console.log(files);
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await this.lib.uploadToCloudinary({
          fileName: file.filename,
          path: file.path,
        });
        if (uploaded?.secure_url) {
          if (
            developerProfileDto.reference &&
            Array.isArray(developerProfileDto.reference) &&
            developerProfileDto.reference[i]
          ) {
            developerProfileDto.reference[i].document = uploaded.secure_url;
          }
        }
      }
    }

    console.log(developerProfileDto);
    const result = await this.developerService.createDeveloper(
      req.params.id,
      developerProfileDto,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Devloper Information Added Successfully!',
      data: result,
    });
  }

  @Get('/:id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  async getSingleDeveloper(@Req() req: Request, @Res() res: Response) {
    const result = await this.developerService.getASingleDeveloper(
      req.params.id,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Devloper fetched Successfully!',
      data: result,
    });
  }
  @Get()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  async getAllDevelopers(@Req() req: Request, @Res() res: Response) {
    const result = await this.developerService.getAllDevelopersFromDB();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Devlopers fetched Successfully!',
      data: result,
    });
  }
}
