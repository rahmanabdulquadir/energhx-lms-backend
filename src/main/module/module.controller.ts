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
import { AuthGuard } from 'src/guard/auth.guard';
import { UserRole } from '@prisma/client';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { IdDto } from 'src/common/id.dto';
import sendResponse from 'src/utils/sendResponse';
import { Response } from 'express';
import { CreateModuleDto, UpdateModuleDto } from './module.dto';
import { ModuleService } from './module.service';

@Controller('module')
export class ModuleController {
  constructor(private moduleService: ModuleService) {}

  // Create Module
  @Post()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async createModule(
    @Res() res: Response,
    @Body() data: CreateModuleDto,
  ) {
    const result = await this.moduleService.createModule(data);
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
    const result = await this.moduleService.getSingleModule(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Module retrieved successfully',
      data: result,
    });
  }

  // Update Module
  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async updateModule(
    @Res() res: Response,
    @Param() param: IdDto,
    @Body() data: UpdateModuleDto,
  ) {
    const result = await this.moduleService.updateModule(param.id, data);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Module updated successfully',
      data: result,
    });
  }

  // Delete Module
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
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
