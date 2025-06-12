import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBasicContentDto {
  @IsString()
  title: string;

  @IsString()
  video: string;

  @IsUUID()
  courseId: string;
}
export class UpdateBasicContentDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  video: string;
}
