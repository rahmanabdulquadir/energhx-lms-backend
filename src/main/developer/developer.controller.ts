import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import sendResponse from 'src/utils/sendResponse';
import { DeveloperProfileDto } from './developer.dto';
import { DeveloperService } from './developer.service';
import { Response } from 'express';

@Controller('developer')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  // Create Developer Profile
  @Post('/')
  async createDeveloper(
    @Res() res: Response,
    @Body() developerProfileDto: DeveloperProfileDto,
  ) {
    const result = this.developerService.createDeveloper(developerProfileDto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Devloper Created Successfully!',
      data: result,
    });
  }
}
