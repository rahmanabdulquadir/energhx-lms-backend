import { IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  comment: string;

  @IsNumber()
  rating: number;

  @IsUUID()
  courseId: string;
}

export class UpdateReviewDto {
  @IsOptional()
  @IsString()
  comment: string;

  @IsOptional()
  @IsNumber()
  rating: number;
}
