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
import { ServerService } from './server.service';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { LibService } from 'src/lib/lib.service';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { CreateProfileDto } from '../developer/developer.dto';

@Controller('server')
export class ServerController {
  constructor(
    private readonly serverService: ServerService,
    private readonly lib: LibService,
  ) {}

  // Create Server Profile
  @Post('/profile/:id')
  @UploadInterceptor('files', 10)
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SERVER]))
  async createServerProfile(
    @Body('text') text: string,
    @UploadedFiles() files: any[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    let serverProfileDto: any;

    // 1. Parse text
    const parsed = JSON.parse(text);
    serverProfileDto = plainToInstance(CreateProfileDto, parsed);

    // 2. Validate DTO
    const errors = await validate(serverProfileDto);
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

    // 3. Upload multiple files and assign URLs to reference array
    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploaded = await this.lib.uploadToCloudinary({
          fileName: file.filename,
          path: file.path,
        });
        if (uploaded?.secure_url) {
          if (
            serverProfileDto.reference &&
            Array.isArray(serverProfileDto.reference) &&
            serverProfileDto.reference[i]
          ) {
            serverProfileDto.reference[i].document = uploaded.secure_url;
          }
        }
      }
    }

    // 4. Call service
    const result = await this.serverService.createServerProfile(
      req.params.id,
      serverProfileDto,
    );

    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Server Information Added Successfully!',
      data: result,
    });
  }

  @Get('/:id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  async getSingleServer(@Req() req: Request, @Res() res: Response) {
    const result = await this.serverService.getASingleServer(req.params.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Server fetched Successfully!',
      data: result,
    });
  }

  @Get()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  async getAllServers(@Req() req: Request, @Res() res: Response) {
    const result = await this.serverService.getAllServersFromDB();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Servers fetched Successfully!',
      data: result,
    });
  }
}
