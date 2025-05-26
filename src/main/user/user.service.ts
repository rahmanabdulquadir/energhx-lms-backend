import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
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
    let result: Developer | Server;
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
              role: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    } else {
      result = await this.prisma.server.findUniqueOrThrow({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              email: true,
              id: true,
              role: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    }
    return result;
  }

  // --------------------------------------- Create User ----------------------------------
  public async registerUser(dto: CreateUserDto) {
    const hashedPassword = await this.lib.hashPassword({
      password: dto.password,
      round: 6,
    });

    // Create JWT token with full DTO + hashed password
    const token = this.jwtService.sign(
      {
        ...dto,
        password: hashedPassword,
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '10m',
      },
    );

    const verificationLink = `${this.configService.get(
      'VERIFY_EMAIL_LINK',
    )}?token=${token}`;

    await this.mailerService.sendMail(
      dto.email,
      `<div>
        <p>Hello ${dto.firstName},</p>
        <p>Click the button below to verify your email and complete registration. This link will expire in 10 minutes.</p>
        <p><a href="${verificationLink}"><button>Verify Email</button></a></p>
      </div>`,
    );

    return { email: dto.email };
  }

  public async verifyEmail(token: string) {
    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (error) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists.');
    }

    const createdUser = await this.prisma.user.create({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        gender: payload.gender,
        phone: payload.phone,
        email: payload.email,
        password: payload.password,
        imageUrl: payload.imageUrl,
        streetNumber: payload.streetNumber,
        street: payload.street,
        city: payload.city,
        postalCode: payload.postalCode,
        province: payload.province,
        country: payload.country,
        role: payload.role,
        status: 'ACTIVE',
      },
    });

    return { userId: createdUser.id };
  }
}
