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
import { AuthGuard } from 'src/guard/auth.guard';
import { UserRole } from '@prisma/client';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { CreateContentDto, UpdateContentDto } from './content.dto';
import { IdDto } from 'src/common/id.dto';
import sendResponse from 'src/utils/sendResponse';
import { Request, Response } from 'express';
import { ContentService } from './content.service';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { plainToInstance } from 'class-transformer';
import { LibService } from 'src/lib/lib.service';
import { validate } from 'class-validator';

@Controller('content')
export class ContentController {
  constructor(
    private contentService: ContentService,
    private readonly lib: LibService,
  ) {}

  // Create Content
  @Post()
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async createContent(
    @Req() req: Request,
    @Res() res: Response,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    try {
      const parsed = JSON.parse(text);
      const createContentDto = plainToInstance(CreateContentDto, parsed);
  
      // Validate for DESCRIPTION content
      if (
        createContentDto.contentType === 'DESCRIPTION' &&
        !createContentDto.description
      ) {
        throw new HttpException(
          'Description is required for DESCRIPTION content type',
          HttpStatus.BAD_REQUEST,
        );
      }
  
      // Handle VIDEO content
      if (createContentDto.contentType === 'VIDEO') {
        if (!file) {
          throw new HttpException('Video file is required', HttpStatus.BAD_REQUEST);
        }
  
        const uploaded = await this.lib.uploadToCloudinary({
          fileName: file.filename,
          path: file.path,
        });
  
        if (!uploaded?.secure_url || !uploaded?.public_id) {
          throw new HttpException('Failed to upload video', 500);
        }
  
        // ✅ Assign video URL, public ID, and duration directly from upload response
        createContentDto.videoUrl = uploaded.secure_url;
        createContentDto.videoPublicId = uploaded.public_id;
        createContentDto.videoDuration = Math.floor(uploaded.duration || 0); // <-- THIS LINE is key
      }
  
      const errors = await validate(createContentDto);
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
  
      const result = await this.contentService.createContent(
        createContentDto,
        req.user,
      );
  
      sendResponse(res, {
        statusCode: HttpStatus.CREATED,
        success: true,
        message: 'Content created successfully',
        data: result,
      });
  
    } catch (err) {
      console.error('💥 Content creation error:', err);
      sendResponse(res, {
        statusCode: err?.status || 500,
        success: false,
        message: err?.message || 'Internal server error',
        data: null,
      });
    }
  }
  
  @Get()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async getAllContent(@Req() req: Request, @Res() res: Response) {
    const result = await this.contentService.getAllContent();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'All content retrieved successfully',
      data: result,
    });
  }

  // Get single content
  @Get(':id')
@UseGuards(AuthGuard)
public async getSingleContent(
  @Req() req: Request,
  @Res() res: Response,
  @Param() param: IdDto,
) {
  const result = await this.contentService.getSingleContent(param.id, req.user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Content retrieved successfully',
    data: result,
  });
}

  // Update Content
  @Patch(':id')
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async updateContent(
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

    // Parse text payload if available
    if (text) {
      rawData = JSON.parse(text);
    }

    // Upload file if provided
    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        rawData.video = uploaded.secure_url;
      }
    }

    // Convert to DTO
    const updateContentDto = plainToInstance(UpdateContentDto, rawData);

    // Validate
    const errors = await validate(updateContentDto);
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
    const result = await this.contentService.updateContent(
      param.id,
      updateContentDto,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Content updated successfully',
      data: result,
    });
  }

  // Delete Content
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async deleteContent(
    @Req() req: Request,
    @Res() res: Response,
    @Param() param: IdDto,
  ) {
    const result = await this.contentService.deleteContent(param.id, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Content and associated data deleted successfully',
      data: result,
    });
  }
}
