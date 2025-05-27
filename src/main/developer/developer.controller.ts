import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import sendResponse from 'src/utils/sendResponse';
import { DeveloperService } from './developer.service';
import { Request, Response } from 'express';
import { CreateDeveloperProfileDto } from './developer.dto';
import { AuthGuard } from 'src/guard/auth.guard';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';

@Controller('developer')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  // Create Developer Profile
  @Post('/profile/:id')
  async createDeveloper(
    @Req() req: Request,
    @Res() res: Response,
    @Body() developerProfileDto: CreateDeveloperProfileDto,
  ) {
    const result = await this.developerService.createDeveloper(
      req.params.id,
      developerProfileDto,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Devloper information added Successfully!',
      data: result,
    });
  }

  @Get('/:id')
  //  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  async getSingleDeveloper(@Req() req: Request, @Res() res: Response) {
    const result = await this.developerService.getASingleDeveloper(req.params.id);
    console.log('From Controller -> ', result);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Devloper fetched Successfully!',
      data: result,
    });
  }
}
