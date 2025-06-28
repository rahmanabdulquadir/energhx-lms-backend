import { IsEmail, IsString, MinLength } from 'class-validator';

// login
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, {
    message: 'Password is too short. Minimum length is 6 characters.',
  })
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Password is too short. Minimum 6 characters.' })
  password: string;

  @IsString()
  @MinLength(6, { message: 'Confirm password is too short. Minimum 6 characters.' })
  confirmPassword: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6, {
    message: 'Password is too short. Minimum length is 6 characters.',
  })
  newPassword: string;
}
