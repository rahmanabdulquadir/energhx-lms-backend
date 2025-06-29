import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Status } from '@prisma/client';
import { ChangePasswordDto } from './auth.dto';
import { MailerService } from 'src/utils/sendMail';
import { ApiResponse } from 'src/utils/sendResponse';
import { TUser } from 'src/interface/token.type';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  // Login
  public async loginUser(data: { email: string; password: string }) {
    const { email, password } = data;
    const user = await this.prisma.user.findUnique({
      where: { email, status: Status.ACTIVE },
    });

    if (!user) throw new HttpException('User not found', 401);
    if (!user.password)
      throw new HttpException(
        'Please create a password first. Verify your mail',
        HttpStatus.BAD_REQUEST,
      );

    const isCorrectPassword = await bcrypt.compare(password, user.password);
    if (!isCorrectPassword) throw new HttpException('Invalid credentials', 401);

    const payload = { email: user.email, userType: user.userType, id: user.id };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_SECRET'),
      expiresIn: 2592000000,
    });
    // const refreshToken = this.jwtService.sign(payload, {
    //   secret: this.configService.getOrThrow('REFRESH_SECRET'),
    // });
    return {
      accessToken,
    };
  }

  // ----------------------------------------------Change Password-------------------------------------------------
  public async changePassword(user: TUser, payload: ChangePasswordDto) {
    const userData = await this.prisma.user.findUniqueOrThrow({
      where: {
        email: user?.email,
        status: Status.ACTIVE,
      },
    });

    // console.log('📄 Fetched user from DB:', {
    //   email: userData.email,
    //   status: userData.status,
    //   hashedPassword: userData.password,
    // });

    const isCorrectPassword = await bcrypt.compare(
      payload.password,
      userData.password as string,
    );

    if (!isCorrectPassword) {
      throw new HttpException(
        'Current password is incorrect',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (payload.password === payload.confirmPassword) {
      throw new HttpException(
        'New password must be different from the old one',
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(payload.confirmPassword, 12);
    await this.prisma.user.update({
      where: {
        email: userData.email,
      },
      data: {
        password: hashedPassword,
      },
    });
    return { message: 'Password updated successfully' };
  }

  // ---------------------------------------------------Forgot Password-------------------------------------------------
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email, status: Status.ACTIVE },
    });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const payload = { email: user.email, userType: user.userType, id: user.id };
    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: 2592000000,
    });
    const resetPassLink = `${this.configService.get('FRONTEND_URL')}/user-create-password?token=${token}`;
    await this.mailerService.sendMail(
      user.email,
      `<div>
          <p>Dear User,</p>
          <p>Click on this Button to reset your password. Link expires in 10 minutes.</p> 
          <p>
              <a href="${resetPassLink}">
                  <button>
                      Reset Password
                  </button>
              </a>
          </p>
      </div>`,
      'Reset Password Link 🔗',
      'Click on the link to reset your password. Link expires in 10 minutes.',
    );
    return null;
  }

  public async resetPassword(payload: { newPassword: string }, token: string) {
    // console.log(payload, token);
    // 1. Decode token
    const decoded: any = this.jwtService.verify(token, {
      secret: this.configService.get('JWT_SECRET'),
    });

    // 2. Fetch user
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    if (user.status === 'BLOCKED') {
      throw new HttpException('This user is blocked!', HttpStatus.FORBIDDEN);
    }

    // 3. Hash new password
    const newHashedPassword = await bcrypt.hash(
      payload.newPassword,
      Number(this.configService.get('BCRYPT_SALT_ROUNDS') || 10),
    );

    // 4. Update user
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: newHashedPassword,
        updatedAt: new Date(),
      },
    });

    return null;
  }
}
