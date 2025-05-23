import { HttpStatus, Injectable } from '@nestjs/common';
import { Server } from 'http';
import { TUser } from 'src/interface/token.type';
import { LibService } from 'src/lib/lib.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponse } from 'src/utils/sendResponse';
import { CreateAnUserDto } from './user.dto';
import { Developer, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lib: LibService,
  ) {}

  // ------------------------------- Get Me -------------------------------
  public async getMe(user: TUser) {
    let result: Developer | Server;
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
    } else  if (user.role == 'SERVER') {
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

    return {
      data: result,
      success: true,
      message: 'User data fetched Successfully',
      statusCode: HttpStatus.OK,
    };
  }

  // --------------------------------------- Create Admin ----------------------------------
  public async registerUser({
    name,
    email,
    password,
    role,
  }: CreateAnUserDto): Promise<ApiResponse<User>> {
    const hashedPassword = await this.lib.hashPassword({
      password,
      round: 6,
    });
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
    if(role == "DEVELOPER") {
      await this.prisma.developer.create({
        data: {
          email,
          userId: newUser.id,
        },
      });
    } else if(role == "SERVER") {
      await this.prisma.server.create({
        data: {
          email,
          userId: newUser.id,
        },
      });
    }
    return {
      success: true,
      message: 'Admin created successfully',
      statusCode: HttpStatus.CREATED,
      data: newUser,
    };
  }
}
