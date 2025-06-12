import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAdminDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

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
        'StateId does not belong to the provided countryId',
        HttpStatus.BAD_REQUEST,
      );
    }
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
          userType: 'ADMIN',
        },
      });
      await tx.admin.create({
        data: {
          userId: user.id,
          email: user.email,
          canAccess: dto.canAccess,
        },
      });
    });
  }

  public async getASingleAdmin(id: string) {
    const existingAdmin = await this.prisma.admin.findUnique({ where: { id } });
    if (!existingAdmin)
      throw new HttpException('Admin not found!', HttpStatus.NOT_FOUND);
    return existingAdmin;
  }

  public async getAllAdminsFromDB() {
    const existingAdmin = await this.prisma.admin.findMany();
    if (!existingAdmin || existingAdmin.length == 0)
      throw new HttpException('Admin not found!', HttpStatus.NOT_FOUND);
    return existingAdmin;
  }
}
