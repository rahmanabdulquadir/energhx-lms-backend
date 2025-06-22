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
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { plainToInstance } from 'class-transformer';
import { LibService } from 'src/lib/lib.service';
import { CreateAdminDto } from './admin.dto';
import { validate } from 'class-validator';
import sendResponse from 'src/utils/sendResponse';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly lib: LibService,
  ) {}

  @Post('add-an-admin')
  @UploadInterceptor('file')
  async registerUser(
    @Body('text') text: string,
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    // Parse text and transform to DTO instance
    const parsed = JSON.parse(text);
    const createAdminDto = plainToInstance(CreateAdminDto, parsed);

    // If file is uploaded, attach URL
    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        createAdminDto.profile_photo = uploaded.secure_url;
      }
    }

    // Validate the parsed DTO manually
    const errors = await validate(createAdminDto);
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
    const result = await this.adminService.addAnAdmin(createAdminDto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Admin account has been created successfully!!',
      data: result,
    });
  }

  @Get('/:id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  async getSingleAdmin(@Req() req: Request, @Res() res: Response) {
    const result = await this.adminService.getASingleAdmin(req.params.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Admin fetched Successfully!',
      data: result,
    });
  }

  @Get()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  async getAllAdmins(@Res() res: Response) {
    const result = await this.adminService.getAllAdminsFromDB();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'All Admins fetched Successfully!',
      data: result,
    });
  }

  @Patch('/:id')
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  async updateAdmin(
    @Param('id') id: string,
    @Body('text') text: string,
    @UploadedFile() file: any,
    @Res() res: Response,
  ) {
    const parsed = JSON.parse(text);
    const updateAdminDto = plainToInstance(CreateAdminDto, parsed); // using CreateAdminDto since it's reused

    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        updateAdminDto.profile_photo = uploaded.secure_url;
      }
    }

    const errors = await validate(updateAdminDto, { skipMissingProperties: true });
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

    const result = await this.adminService.updateAdmin(id, updateAdminDto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Admin updated successfully!',
      data: result,
    });
  }


  @Delete('/:id')
@UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
async deleteAdmin(@Param('id') id: string, @Res() res: Response) {
  await this.adminService.deleteAnAdmin(id);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Admin deleted successfully!',
    data: "NO ADMIN IS AVAILABLE REGARDING THIS ID"
  });
}
}
