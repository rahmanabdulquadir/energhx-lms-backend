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
  Patch,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import {
  CreateQuizDto,
  CreateQuizResultDto,
  SubmitAnswerDto,
  UpdateQuizDto,
  UpdateSingleQuizDto,
} from './quiz.dto';
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
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  async createQuiz(
    @Body() createQuizDto: CreateQuizDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.quizService.createQuiz(createQuizDto, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quiz added Successfully',
      data: result,
    });
  }

  @Get('get-all-quizzes/:id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  async getAllQuizzes(
    @Param() param: IdDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.quizService.getAllQuizzes(param.id, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quizzes retrieved successfully',
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
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: `Quiz submitted successfully. Score: ${score}/${total}`,
      data: { quizSubmission, score, total },
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  async updateQuiz(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateSingleQuizDto, // note: direct quiz fields here, no nested array
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.quizService.updateQuiz(
      id,
      updateQuizDto,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quiz updated successfully',
      data: result,
    });
  }

  @Delete('delete-quiz/:id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN, UserRole.SUPER_ADMIN]))
  async deleteQuiz(
    @Param() param: IdDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.quizService.deleteQuiz(param.id, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Quiz deleted successfully',
      data: result,
    });
  }

@Get('result')
@UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
async getQuizResult(
  @Req() req: Request,
  @Res() res: Response,
) {
  const result = await this.quizService.getQuizResult(req.user);
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: 'Quiz result fetched successfully',
    data: result,
  });
}
}
