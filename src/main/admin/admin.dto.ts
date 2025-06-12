import {
    IsString,
    IsEmail,
    Length,
    IsOptional,
    IsInt,
    IsEnum,
  } from 'class-validator';
  import { Gender, RolesToAccessForAdmin } from '@prisma/client';

export class CreateAdminDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(2, 50)
  firstName: string;

  @IsString()
  @Length(2, 50)
  lastName: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  otherName?: string;

  @IsEnum(Gender)
  sex: Gender;

  @IsOptional()
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  profile_photo: string;

  @IsInt()
  streetNumber: number;

  @IsString()
  street: string;

  @IsInt()
  postalCode: number;

  @IsString()
  city: string;

  @IsString()
  countryId: string;

  @IsString()
  stateId: string;

  @IsEnum(RolesToAccessForAdmin)
  canAccess: RolesToAccessForAdmin;
}