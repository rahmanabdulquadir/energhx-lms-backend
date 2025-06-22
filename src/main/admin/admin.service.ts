import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto } from './admin.dto';
import { LibService } from 'src/lib/lib.service';
import { MailerService } from 'src/utils/sendMail';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lib: LibService,
    private readonly configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  // -------------------------------- Add an Admin --------------------------------
  public async addAnAdmin(dto: CreateAdminDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) throw new HttpException('User already exists!', 404);
    const state = await this.prisma.state.findUnique({
      where: { id: dto.stateId },
    });
    if (!state) {
      throw new HttpException('Invalid stateId', HttpStatus.BAD_REQUEST);
    }
    if (state.countryId !== dto.countryId) {
      throw new HttpException(
        'State does not belong to the provided country',
        HttpStatus.BAD_REQUEST,
      );
    }
    const hashedPassword = await this.lib.hashPassword({
      password: this.configService.get('ADMIN_PASS') as string,
      round: 6,
    });
    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
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
          userType: UserRole.ADMIN,
          password: hashedPassword,
          isVerified: true,
        },
      });
      await tx.admin.create({
        data: {
          userId: user.id,
          email: user.email,
          canAccess: dto.canAccess,
        },
      });
      await this.mailerService.sendMail(
        dto.email,
        `<div>
          <p>Hello ${dto.firstName},</p>
          <p>Congratulations, you are assigned as a ${dto.canAccess} admin in Energhx. Please login with your mail and the initial password (provided below) into the system. Don't forget to change the password as soon as you are logged in.</p>
          <p>Initial Password: <strong>${this.configService.get('ADMIN_PASS')}</strong></p>
          <a href="${this.configService.get('FRONTEND_URL')}/login">Click here to login</a>
          <p>Thank you for being a part of Energhx.</p>
        </div>`,
        'Congratulations on getting appointed as admin in energhx',
        'Click on the button to login into energhx as admin, and change your password.',
      );
    });
  }

  public async getASingleAdmin(id: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
      include: {
        user: true, // this will include the full linked user details
      },
    });
  
    if (!admin) {
      throw new HttpException('Admin not found!', HttpStatus.NOT_FOUND);
    }
  
    return admin;
  }

  public async getAllAdminsFromDB() {
    const existingAdmin = await this.prisma.admin.findMany({
      include: {
        user: true, // Include all user details
      },
    });
  
    if (!existingAdmin || existingAdmin.length === 0) {
      throw new HttpException('No Admin found!', HttpStatus.NOT_FOUND);
    }
  
    return existingAdmin;
  }

  public async deleteAnAdmin(id: string) {
  const admin = await this.prisma.admin.findUnique({ where: { id } });

  if (!admin) {
    throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
  }
  132

  await this.prisma.$transaction(async (tx) => {
    // Delete the admin record
    await tx.admin.delete({ where: { id } });

    // Delete the user record linked to this admin
    await tx.user.delete({ where: { id: admin.userId } });
  });
}

public async updateAdmin(id: string, dto: Partial<CreateAdminDto>) {
  const admin = await this.prisma.admin.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!admin) {
    throw new HttpException('Admin not found', HttpStatus.NOT_FOUND);
  }

  // Optional: Validate state-country relation if any of them is being updated
  if (dto.stateId || dto.countryId) {
    const state = await this.prisma.state.findUnique({
      where: { id: dto.stateId ?? admin.user.stateId },
    });

    if (!state) {
      throw new HttpException('Invalid stateId', HttpStatus.BAD_REQUEST);
    }

    if ((dto.countryId ?? admin.user.countryId) !== state.countryId) {
      throw new HttpException(
        'State does not belong to the provided country',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  return await this.prisma.$transaction(async (tx) => {
    // Update the user info if provided
    await tx.user.update({
      where: { id: admin.userId },
      data: {
        firstName: dto.firstName ?? undefined,
        lastName: dto.lastName ?? undefined,
        otherName: dto.otherName ?? undefined,
        email: dto.email ?? undefined,
        sex: dto.sex ?? undefined,
        companyName: dto.companyName ?? undefined,
        profile_photo: dto.profile_photo ?? undefined,
        streetNumber: dto.streetNumber ?? undefined,
        street: dto.street ?? undefined,
        postalCode: dto.postalCode ?? undefined,
        city: dto.city ?? undefined,
        countryId: dto.countryId ?? undefined,
        stateId: dto.stateId ?? undefined,
      },
    });

    // Update the admin-specific fields
    const updatedAdmin = await tx.admin.update({
      where: { id },
      data: {
        email: dto.email ?? undefined,
        canAccess: dto.canAccess ?? undefined,
      },
      include: {
        user: true,
      },
    });

    return updatedAdmin;
  });
}
}
