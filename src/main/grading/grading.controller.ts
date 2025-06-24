import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { GradingService } from './grading.service';
import { CreateQuizSubmissionDto } from './dto/create-quiz-submission.dto';
import { Response } from 'express';
import sendResponse from 'src/utils/sendResponse';
import { IdDto } from 'src/common/id.dto';

@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  // 📌 Submit Quiz
  @Post('submit')
  async submitQuiz(
    @Body() dto: CreateQuizSubmissionDto,
    @Res() res: Response,
  ) {
    const result = await this.gradingService.submitQuiz(dto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quiz submitted successfully',
      data: result,
    });
  }

  // 📌 Get User Course Average
  @Get(':courseId/:userId')
  async getAverage(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.gradingService.getCourseAveragePercentage(
      userId,
      courseId,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Average percentage fetched successfully',
      data: result,
    });
  }

  // 📌 Issue Certificate
  @Post(':courseId/:userId/certificate')
  async issueCertificate(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.gradingService.issueCertificate(
      userId,
      courseId,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Certificate issued successfully',
      data: result,
    });
  }

  // 📌 Get Certificate
  @Get(':courseId/:userId/certificate')
  async getCertificate(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.gradingService.getCertificate(
      userId,
      courseId,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Certificate retrieved successfully',
      data: result,
    });
  }

  // 📌 Get Quiz Results per Course
  @Get(':courseId/:userId/results')
  async getUserResults(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
    @Res() res: Response,
  ) {
    const result = await this.gradingService.getUserResultsForCourse(
      userId,
      courseId,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'User quiz results fetched successfully',
      data: result,
    });
  }
}
