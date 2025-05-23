import { IsEmail, IsEnum, IsString, Length, MinLength } from 'class-validator';

export enum Role {
  DEVELOPER = 'DEVELOPER',
  SERVER = 'SERVER',
}

export class CreateAnUserDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}
