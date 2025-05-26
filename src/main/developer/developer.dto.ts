import { Gender } from '@prisma/client';
import { IsString, IsUUID } from 'class-validator';

// for developer profile
export class DeveloperProfileDto {
  @IsString()
  @IsUUID('4', { message: 'ID must be a valid UUID (version 4).' })
  userId: string;

  @IsString()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  gender: Gender;

  @IsString()
  imageUrl: string;

  @IsString()
  phone: string;
}
