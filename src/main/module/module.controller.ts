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
import { IdDto } from 'src/common/id.dto';
import sendResponse from 'src/utils/sendResponse';
import { Request, Response } from 'express';
import { CreateModuleDto, UpdateModuleDto } from './module.dto';
import { ModuleService } from './module.service';
import { UploadInterceptor } from 'src/common/upload.interceptor';
import { plainToInstance } from 'class-transformer';
import { LibService } from 'src/lib/lib.service';
import { validate } from 'class-validator';

@Controller('module')
export class ModuleController {
  constructor(
    private moduleService: ModuleService,
    private readonly lib: LibService,
  ) {}

  // Create Module
  @Post()
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async createModule(
    @Req() req: Request,
    @Res() res: Response,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    const parsed = JSON.parse(text);
    const createModuleDto = plainToInstance(CreateModuleDto, parsed);

    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        createModuleDto.thumbnail = uploaded.secure_url;
      }
    }
    const errors = await validate(createModuleDto);
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
    const result = await this.moduleService.createModule(
      createModuleDto,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Module created successfully',
      data: result,
    });
  }

  // Get all Modules
  @Get('/course-modules/:id')
  async getAllModules(@Res() res: Response, @Param() param: IdDto) {
    const result = await this.moduleService.getAllModules(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'All Modules retrieved successfully',
      data: result,
    });
  }

  // Get single Module
  @Get(':id')
  @UseGuards(AuthGuard)
  public async getSingleModule(
    @Res() res: Response,
    @Param() param: IdDto,
    @Req() req: Request,
  ) {
    const result = await this.moduleService.getSingleModule(param.id, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Module retrieved successfully',
      data: result,
    });
  }

  // Update Module
  @Patch(':id')
  @UploadInterceptor('file')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  public async updateModule(
    @Req() req: Request,
    @Res() res: Response,
    @Param() param: IdDto,
    @Body('text') text: string,
    @UploadedFile() file: any,
  ) {
    let updateModuleDto: any = {};
    if (!text && !file) {
      throw new HttpException(
        'No data provided for update',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (text) {
      const parsed = JSON.parse(text);
      updateModuleDto = plainToInstance(UpdateModuleDto, parsed);
    }
    if (file) {
      const uploaded = await this.lib.uploadToCloudinary({
        fileName: file.filename,
        path: file.path,
      });
      if (uploaded?.secure_url) {
        updateModuleDto.thumbnail = uploaded.secure_url;
      }
    }
    await validate(updateModuleDto);
    const result = await this.moduleService.updateModule(
      param.id,
      updateModuleDto,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Module updated successfully',
      data: result,
    });
  }

  // Delete Module
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.SUPER_ADMIN]))
  public async deleteModule(@Res() res: Response, @Param() param: IdDto) {
    const result = await this.moduleService.deleteModule(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Module and associated data deleted successfully',
      data: result,
    });
  }
}
