import {
  Body,
  Controller,
  Delete,
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
import { CreateBasicContentDto } from './basic-content.dto';

@Controller('basic-content')
export class BasicContentController {
  constructor(
    private readonly basicContentService: BasicContentService,
    private readonly lib: LibService,
  ) {}

//   // Create Content
//   @Post()
//   @UploadInterceptor('file')
//   @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
//   public async createContent(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Body('text') text: string,
//     @UploadedFile() file: any,
//   ) {
//     const parsed = JSON.parse(text);
//     const createBasicContentDto = plainToInstance(
//       CreateBasicContentDto,
//       parsed,
//     );
//     if (
//       createBasicContentDto.contentType == 'DESCRIPTION' &&
//       !createBasicContentDto.description
//     ) {
//       throw new HttpException(
//         'Description is required for DESCRIPTION content type',
//         HttpStatus.BAD_REQUEST,
//       );
//     }
//     if (createBasicContentDto.contentType == 'VIDEO') {
//       if (!file)
//         throw new HttpException(
//           'Video file is required',
//           HttpStatus.BAD_REQUEST,
//         );
//       const uploaded = await this.lib.uploadToCloudinary({
//         fileName: file.filename,
//         path: file.path,
//       });
//       if (uploaded?.secure_url) {
//         createBasicContentDto.video = uploaded.secure_url;
//       }
//     }
//     const errors = await validate(createBasicContentDto);
//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         statusCode: HttpStatus.BAD_REQUEST,
//         message:
//           Object.values(errors[0].constraints || {})[0] || 'Validation failed',
//         errorDetails: errors.map((err) => ({
//           property: err.property,
//           constraints: err.constraints,
//         })),
//       });
//     }
//     const result = await this.basicContentService.createContent(
//       createBasicContentDto,
//       req.user,
//     );
//     sendResponse(res, {
//       statusCode: HttpStatus.OK,
//       success: true,
//       message: 'Content created successfully',
//       data: result,
//     });
//   }

//   // Update Content
//   @Patch(':id')
//   @UploadInterceptor('file')
//   @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
//   public async updateContent(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Param() param: IdDto,
//     @Body('text') text: string,
//     @UploadedFile() file: any,
//   ) {
//     let rawData: any = {};

//     if (!text && !file) {
//       throw new HttpException(
//         'No data provided for update',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     // Parse text payload if available
//     if (text) {
//       rawData = JSON.parse(text);
//     }

//     // Upload file if provided
//     if (file) {
//       const uploaded = await this.lib.uploadToCloudinary({
//         fileName: file.filename,
//         path: file.path,
//       });
//       if (uploaded?.secure_url) {
//         rawData.video = uploaded.secure_url;
//       }
//     }

//     // Convert to DTO
//     const updateContentDto = plainToInstance(UpdateContentDto, rawData);

//     // Validate
//     const errors = await validate(updateContentDto);
//     if (errors.length > 0) {
//       return res.status(400).json({
//         success: false,
//         statusCode: HttpStatus.BAD_REQUEST,
//         message:
//           Object.values(errors[0].constraints || {})[0] || 'Validation failed',
//         errorDetails: errors.map((err) => ({
//           property: err.property,
//           constraints: err.constraints,
//         })),
//       });
//     }

//     // Proceed with update
//     const result = await this.basicContentService.updateContent(
//       param.id,
//       updateContentDto,
//       req.user,
//     );
//     sendResponse(res, {
//       statusCode: HttpStatus.OK,
//       success: true,
//       message: 'Content updated successfully',
//       data: result,
//     });
//   }

//   // Delete Content
//   @Delete(':id')
//   @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
//   public async deleteContent(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Param() param: IdDto,
//   ) {
//     const result = await this.basicContentService.deleteContent(
//       param.id,
//       req.user,
//     );
//     sendResponse(res, {
//       statusCode: HttpStatus.OK,
//       success: true,
//       message: 'Content and associated data daleted successfully',
//       data: result,
//     });
//   }
}
