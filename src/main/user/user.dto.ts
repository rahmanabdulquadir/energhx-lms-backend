import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { Gender, UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @Matches(/^[0-9]{10,15}$/, {
    message: 'Phone number must be between 10 to 15 digits.',
  })
  phone: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  imageUrl: string;

  @IsInt()
  streetNumber: number;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsInt()
  postalCode: number;

  @IsString()
  province: string;

  @IsString()
  country: string;

  @IsEnum(UserRole)
  role: UserRole;
}
