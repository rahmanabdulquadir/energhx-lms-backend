import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { GradingService } from './grading.service';
import { CreateQuizSubmissionDto } from './dto/create-quiz-submission.dto';

@Controller('grading')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Post('submit')
  submitQuiz(@Body() dto: CreateQuizSubmissionDto) {
    return this.gradingService.submitQuiz(dto);
  }

  @Get(':courseId/:userId')
  getAverage(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ) {
    return this.gradingService.getCourseAveragePercentage(userId, courseId);
  }

  @Post(':courseId/:userId/certificate')
  issueCertificate(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ) {
    return this.gradingService.issueCertificate(userId, courseId);
  }

  @Get(':courseId/:userId/certificate')
  getCertificate(
    @Param('courseId') courseId: string,
    @Param('userId') userId: string,
  ) {
    return this.gradingService.getCertificate(userId, courseId);
  }
}
