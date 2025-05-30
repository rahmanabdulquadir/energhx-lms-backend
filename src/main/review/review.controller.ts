import {
  Body,
  Controller,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { AuthGuard } from 'src/guard/auth.guard';
import { RoleGuardWith } from 'src/utils/RoleGuardWith';
import { UserRole } from '@prisma/client';
import sendResponse from 'src/utils/sendResponse';
import { Request, Response } from 'express';
import { IdDto } from 'src/common/id.dto';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';

@Controller('review')
export class ReviewController {
  constructor(private ReviewService: ReviewService) {}

  // Create Review
  @Post()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async createReview(
    @Res() res: Response,
    @Req() req: Request,
    @Body() data: CreateReviewDto,
  ) {
    const result = await this.ReviewService.createReview(data, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Review created successfully',
      data: result,
    });
  }

  // Update Review
  @Patch(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  public async updateReview(
    @Res() res: Response,
    @Param() param: IdDto,
    @Body() data: UpdateReviewDto,
  ) {
    const result = await this.ReviewService.updateReview(param.id, data);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Review updated successfully',
      data: result,
    });
  }
}
