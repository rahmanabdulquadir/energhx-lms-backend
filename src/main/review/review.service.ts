import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto, UpdateReviewDto } from './review.dto';
import { TUser } from 'src/interface/token.type';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  // --------------------------------Get Single Course Reviews-----------------------------------
  public async getSingleCourseReviews(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        reviews: true,
      },
    });
    if (!course) throw new HttpException('Course Not Found!', 404);
    if (course.reviews.length === 0)
      throw new HttpException('Course has no reviews!', 404);

    const result = await this.prisma.review.findMany({
      where: { courseId },
      include: {
        user: true,
      },
    });
    return result;
  }

  // --------------------------------Get My Reviews-----------------------------------
  public async getMyReviews(user: TUser) {
    const myReviews = await this.prisma.review.findMany({
      where: { userId: user.id },
      include: {
        course: true,
      },
    });
    if (!myReviews) throw new HttpException('Reviews Not Found!', 404);
    if (myReviews.length === 0)
      throw new HttpException('You made no review!', 404);
    return myReviews;
  }

  //----------------------------------Get All Reviews---------------------------------------
  public async getAllReviews() {
    const result = await this.prisma.review.findMany();
    return result;
  }

  //---------------------------------------Create Review--------------------------------------------
  public async createReview(payload: CreateReviewDto, user: TUser) {
    return await this.prisma.$transaction(async (tx) => {
      const course = await tx.course.findUnique({
        where: { id: payload.courseId },
      });
      if (!course) throw new HttpException('Course Not Found', 404);

      const program = await tx.program.findFirst({
        where: {
          courses: {
            some: {
              id: payload.courseId,
            },
          },
        },
      });

      if (program?.publishedFor !== user.userType) {
        throw new HttpException(
          'You are not authorized to make this review!',
          HttpStatus.BAD_REQUEST,
        );
      }

      const progress = await tx.progress.findUnique({
        where: {
          userId_courseId: { userId: user.id, courseId: payload.courseId },
        },
      });
      if (!progress)
        throw new HttpException(
          'Complete the course first!',
          HttpStatus.BAD_REQUEST,
        );
      if (progress?.percentage < 100)
        throw new HttpException(
          'Complete the course first!',
          HttpStatus.BAD_REQUEST,
        );

      const review = await tx.review.create({
        data: {
          ...payload,
          userId: user.id,
        },
      });

      // Recalculate averageRating using aggregation
      const { _avg } = await tx.review.aggregate({
        where: { courseId: payload.courseId },
        _avg: { rating: true },
      });

      await tx.course.update({
        where: { id: payload.courseId },
        data: {
          averageRating: _avg.rating ?? 0,
        },
      });

      return review;
    });
  }

  //---------------------------------------Update Review--------------------------------------------
  public async updateReview(id: string, data: UpdateReviewDto, user: TUser) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
    if (!review) throw new HttpException('Review Not Found', 404);
    if (review.userId !== user.id)
      throw new HttpException(
        'You are not authorized to update this review!',
        HttpStatus.BAD_REQUEST,
      );

    const updated = await this.prisma.review.update({
      where: { id },
      data,
    });

    return updated;
  }

  //---------------------------------------Delete Review--------------------------------------------
  public async deleteReview(id: string, user: TUser) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
    if (!review) throw new HttpException('Review Not Found', 404);
    if (review.userId !== user.id)
      throw new HttpException(
        'You are not authorized to delete this review!',
        HttpStatus.BAD_REQUEST,
      );
    await this.prisma.review.delete({
      where: { id },
    });
    return null;
  }
}
