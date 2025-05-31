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

  // Get single Course Review
  @Get('/course/:id')
  @UseGuards(AuthGuard)
  public async getSingleReview(@Res() res: Response, @Param() param: IdDto) {
    const result = await this.ReviewService.getSingleCourseReviews(param.id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Course reviews retrieved successfully',
      data: result,
    });
  }

  // Get My Reviews
  @Get('/my-reviews')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
  public async getMyReviews(@Res() res: Response, @Req() req: Request) {
    const result = await this.ReviewService.getMyReviews(req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'My Reviews retrieved successfully',
      data: result,
    });
  }

  // Get all Reviews
  @Get()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.ADMIN]))
  async getAllReviews(@Res() res: Response) {
    const result = await this.ReviewService.getAllReviews();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'All Reviews retrieved successfully',
      data: result,
    });
  }

  // Create Review
  @Post()
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
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
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
  public async updateReview(
    @Res() res: Response,
    @Req() req: Request,
    @Param() param: IdDto,
    @Body() data: UpdateReviewDto,
  ) {
    const result = await this.ReviewService.updateReview(
      param.id,
      data,
      req.user,
    );
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Review updated successfully',
      data: result,
    });
  }

  // Delete Review
  @Delete(':id')
  @UseGuards(AuthGuard, RoleGuardWith([UserRole.DEVELOPER, UserRole.SERVER]))
  public async deleteReview(
    @Res() res: Response,
    @Req() req: Request,
    @Param() param: IdDto,
  ) {
    const result = await this.ReviewService.deleteReview(param.id, req.user);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Review deleted successfully',
      data: result,
    });
  }
}
