import { UserRole } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateProgramDto {
  @IsString()
  title: string;

  @IsNumber()
  price: number;

  @IsString()
  thumbnail: string;

  @IsString()
  description: string;

  @IsString()
  @IsEnum(UserRole)
  publishedFor: UserRole;
}

export class UpdateProgramDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  thumbnail: string;

  @IsOptional()
  @IsString()
  description: string;
}
