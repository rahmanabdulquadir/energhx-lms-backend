import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @IsString()
  comment: string;

  @IsNumber()
  @Max(5)
  @Min(0)
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
  @Max(5)
  @Min(0)
  rating: number;
}
