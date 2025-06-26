import { ContentType } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateContentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  videoUrl?: string; // actual video URL for playback

  @IsOptional()
  @IsString()
  videoPublicId?: string; // actual Cloudinary public_id (used for metadata)

  @IsOptional()
  @IsNumber()
  videoDuration?: number;

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
  description?: string;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsString()
  videoUrl?: string; // ✅ Renamed for consistency
}
