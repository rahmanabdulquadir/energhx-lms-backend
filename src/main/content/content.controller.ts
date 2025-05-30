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
import { CreateContentDto, UpdateContentDto } from './content.dto';
import { IdDto } from 'src/common/id.dto';
import sendResponse from 'src/utils/sendResponse';
import { Response } from 'express';
import { ContentService } from './content.service';

@Controller('content')
export class ContentController {
  constructor(private contentService: ContentService) {}

  // Create Content
  @Post()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async createContent(
    @Res() res: Response,
    @Body() data: CreateContentDto,
  ) {
    const result = await this.contentService.createContent(data);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Content created successfully',
      data: result,
    });
  }

  // Update Content
  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async updateContent(
    @Res() res: Response,
    @Param() param: IdDto,
    @Body() data: UpdateContentDto,
  ) {
    const result = await this.contentService.updateContent(param.id, data);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Content updated successfully',
      data: result,
    });
  }
}
