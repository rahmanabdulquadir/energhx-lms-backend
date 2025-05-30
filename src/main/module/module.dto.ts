import { IsString, IsOptional } from 'class-validator';

export class CreateModuleDto {
  @IsString()
  title: string;

  @IsString()
  thumbnail: string;

  @IsString()
  courseId: string;
}

export class UpdateModuleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  @IsOptional()
  thumbnail?: string;
}
