import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Get,
  Req,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto, SubmitAnswerDto } from './quiz.dto';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { AuthGuard } from 'src/guard/auth.guard';
import { UserRole } from '@prisma/client';
import { IdDto } from 'src/common/id.dto';
import { Request, Response } from 'express';
import sendResponse from 'src/utils/sendResponse';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  async createQuiz(
    @Body() createQuizDto: CreateQuizDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.quizService.createQuiz(createQuizDto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quiz added Successfully',
      data: result,
    });
  }

  @Get('start-quiz/:id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
  async startQuiz(
    @Param() param: IdDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.quizService.startQuiz(param.id, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quizzes retrieved successfully',
      data: result,
    });
  }

  @Post('submit-quiz')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
  async submitQuiz(
    @Body() answer: SubmitAnswerDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { quizSubmission, score, total } = await this.quizService.submitQuiz(
      answer,
      req.user.id,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Quiz submitted successfully. Score: ${score}/${total}`,
      data: quizSubmission,
    });
  }

  @Delete('delete-quiz/:id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  async deleteQuiz(
    @Param() param: IdDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.quizService.deleteQuiz(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quiz deleted successfully',
      data: result,
    });
  }
}
