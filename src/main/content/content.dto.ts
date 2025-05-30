import { ContentType } from '@prisma/client';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  contentType: ContentType;

  @IsUUID()
  moduleId: string;
}


export class UpdateContentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  video?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
