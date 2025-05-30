import { IsString, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  title: string;

  @IsString()
  thumbnail: string;

  @IsString()
  programId: string;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;
}
