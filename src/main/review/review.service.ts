import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { TUser } from 'src/interface/token.type';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  //---------------------------------------Create Review--------------------------------------------
  public async createReview(payload: CreateReviewDto, user: TUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: payload.courseId },
    });
    if (!course) throw new HttpException('Course Not Found', 404);
    // TODO: SEE IF USER HAS THE COURSE AS COMPLETED. MAY NEED A SEPERATE MODEL COMBINING USER< COURSE AND REVIEW
    const Review = await this.prisma.review.create({
      data: {
        ...payload,
        userId: user.id,
      },
    });
    return Review;
  }

  //---------------------------------------Update Review--------------------------------------------
  public async updateReview(id: string, data: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });
    if (!review) throw new HttpException('Review Not Found', 404);

    const updated = await this.prisma.review.update({
      where: { id },
      data,
    });

    return updated;
  }
}
