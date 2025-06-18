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
import { BasicContentService } from './basic-content.service';
import { LibService } from 'src/lib/lib.service';
import sendResponse from 'src/utils/sendResponse';
import { AuthGuard } from 'src/guard/auth.guard';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';
import { IdDto } from 'src/common/id.dto';
import { Request, Response } from 'express';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  CreateBasicContentDto,
  UpdateBasicContentDto,
} from './basic-content.dto';

@Controller('basic-content')
export class BasicContentController {
  constructor(
    private readonly basicContentService: BasicContentService,
    private readonly lib: LibService,
  ) {}

  // Create Basic Content
  @Post()
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async createBasicContent(
    @Req() req: Request,
    @Res() res: Response,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    const parsed = JSON.parse(text);
    const createBasicContentDto = plainToInstance(
      CreateBasicContentDto,
      parsed,
    );

    if (!file)
      throw new HttpException('Video file is required', HttpStatus.BAD_REQUEST);
    const uploaded = await this.lib.uploadToCloudinary({
      fileName: file.filename,
      path: file.path,
    });
    if (uploaded?.secure_url) {
      createBasicContentDto.video = uploaded.secure_url;
    }

    const errors = await validate(createBasicContentDto);
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
    const result = await this.basicContentService.createBasicContent(
      createBasicContentDto,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Basic Content created successfully',
      data: result,
    });
  }


  @Get('all')
@UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
public async getAllBasicContent(@Res() res: Response) {
  const result = await this.basicContentService.getAllBasicContent();
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'All basic content retrieved successfully',
    data: result,
  });
}

  // Update Basic Content
  @Patch(':id')
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async updateBasicContent(
    @Req() req: Request,
    @Res() res: Response,
    @Param() param: IdDto,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    let rawData: any = {};

    if (!text && !file) {
      throw new HttpException(
        'No data provided for update',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (text) rawData = JSON.parse(text);
    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        rawData.video = uploaded.secure_url;
      }
    }
    const updateBasicContentDto = plainToInstance(
      UpdateBasicContentDto,
      rawData,
    );
    const errors = await validate(updateBasicContentDto);
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

    // Proceed with update
    const result = await this.basicContentService.updateBasicContent(
      param.id,
      updateBasicContentDto,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Basic Content updated successfully',
      data: result,
    });
  }

  // Delete Basic Content
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async deleteBasicContent(
    @Req() req: Request,
    @Res() res: Response,
    @Param() param: IdDto,
  ) {
    const result = await this.basicContentService.deleteBasicContent(
      param.id,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Basic Content deleted successfully',
      data: result,
    });
  }
}
