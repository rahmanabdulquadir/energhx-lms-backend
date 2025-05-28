import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Server } from 'http';
import { TUser } from 'src/interface/token.type';
import { LibService } from 'src/lib/lib.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './user.dto';
import { Developer } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from 'src/utils/sendMail';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lib: LibService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  // ------------------------------- Get Me -------------------------------
  public async getMe(user: TUser) {
    let result: Developer | Server | null;
    if (user.role !== 'DEVELOPER' && user.role !== 'SERVER') {
      throw new HttpException(
        'Invalid User role provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (user.role == 'DEVELOPER') {
      result = await this.prisma.developer.findUniqueOrThrow({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              email: true,
              id: true,
              userType: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } else if (user.role == 'SERVER') {
      result = await this.prisma.server.findUniqueOrThrow({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              email: true,
              id: true,
              userType: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } else result = null;
    return result;
  }

  // ------------------------------- Get All Users -------------------------------
  public async getAllUsers() {
    const result = await this.prisma.user.findMany({
      where: { isVerified: true },
    });
    console.log(result);
    return result;
  }

  // --------------------------------------- Create User ----------------------------------
  public async registerUser(dto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const token = this.jwtService.sign(
      { email: dto.email },
      { secret: this.configService.get('JWT_SECRET'), expiresIn: '10m' },
    );

    if (existingUser && !existingUser.isVerified) {
      const verificationLink = `${this.configService.get(
        'VERIFY_EMAIL_LINK',
      )}/user-create-password?token=${token}`;

      await this.mailerService.sendMail(
        dto.email,
        `<div>
          <p>Hello ${dto.firstName},</p>
          <p>Click the button below to verify your email and complete registration. This link will expire in 10 minutes.</p>
          <p><a href="${verificationLink}"><button>Verify Email</button></a></p>
        </div>`,
      );

      return null;
    }

    const state = await this.prisma.state.findUnique({
      where: { id: dto.stateId },
    });
    if (!state) {
      throw new HttpException('Invalid stateId', HttpStatus.BAD_REQUEST);
    }

    if (state.countryId !== dto.countryId) {
      throw new HttpException(
        'stateId does not belong to the provided countryId',
        HttpStatus.BAD_REQUEST,
      );
    }

    const createdUser = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        sex: dto.sex,
        companyName: dto.companyName,
        otherName: dto.otherName,
        email: dto.email,
        profile_photo: dto.profile_photo,
        streetNumber: dto.streetNumber,
        street: dto.street,
        postalCode: dto.postalCode,
        city: dto.city,
        countryId: dto.countryId,
        stateId: dto.stateId,
        userType: dto.userType,
      },
    });
    if (dto.userType == 'DEVELOPER')
      await this.prisma.developer.create({
        data: {
          userId: createdUser.id,
          email: createdUser.email,
        },
      });
    else if (dto.userType == 'SERVER')
      await this.prisma.server.create({
        data: {
          userId: createdUser.id,
          email: createdUser.email,
        },
      });

    const verificationLink = `${this.configService.get(
      'VERIFY_EMAIL_LINK',
    )}/user-create-password?token=${token}`;

    await this.mailerService.sendMail(
      dto.email,
      `<div>
        <p>Hello ${dto.firstName},</p>
        <p>Click the button below to verify your email and complete registration. This link will expire in 10 minutes.</p>
        <p><a href="${verificationLink}"><button>Verify Email</button></a></p>
      </div>`,
    );

    return null;
  }
  // ------------------------------- Create Password -------------------------------
  public async createPassword(
    data: { email: string; password: string },
    token: string,
  ) {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new HttpException(
        'Invalid or expired verification token.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.email !== payload.email)
      throw new HttpException(
        'Invalid Email Provided!',
        HttpStatus.UNAUTHORIZED,
      );

    const existingUser = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!existingUser) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (!!existingUser.password) {
      throw new HttpException(
        'Password already set for this user!',
        HttpStatus.NOT_FOUND,
      );
    }

    const hashedPassword = await this.lib.hashPassword({
      password: data.password,
      round: 6,
    });

    const updatedUser = await this.prisma.user.update({
      where: { email: payload.email },
      data: { password: hashedPassword, isVerified: true },
    });
    return updatedUser;
  }
}
