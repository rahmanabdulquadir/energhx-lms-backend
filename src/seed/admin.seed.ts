import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LibService } from 'src/lib/lib.service';
import { Gender, UserRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserSeeder implements OnModuleInit {
  constructor(
    private readonly config: ConfigService,
    private readonly lib: LibService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const adminExists = await this.prisma.user.findFirst({
      where: {
        userType: 'SUPER_ADMIN',
      },
    });

    if (!adminExists) {
      const hashedPassword = await this.lib.hashPassword({
        password: this.config.getOrThrow('ADMIN_PASS') as string,
        round: 6,
      });
      await this.prisma.$transaction(async (tx) => {
        const country = await tx.country.create({
          data: {
            name: 'Nigeria',
            code: 'NI',
          },
        });

        await tx.state.createMany({
          data: [
            { name: 'Abia', countryId: country.id },
            { name: 'Adamawa', countryId: country.id },
            { name: 'Akwa Ibom', countryId: country.id },
            { name: 'Anambra', countryId: country.id },
            { name: 'Bauchi', countryId: country.id },
            { name: 'Bayelsa', countryId: country.id },
            { name: 'Benue', countryId: country.id },
            { name: 'Borno', countryId: country.id },
            { name: 'Cross River', countryId: country.id },
            { name: 'Delta', countryId: country.id },
            { name: 'Ebonyi', countryId: country.id },
            { name: 'Enugu', countryId: country.id },
            { name: 'Edo', countryId: country.id },
            { name: 'Ekiti', countryId: country.id },
            { name: 'Gombe', countryId: country.id },
            { name: 'Imo', countryId: country.id },
            { name: 'Jigawa', countryId: country.id },
            { name: 'Kaduna', countryId: country.id },
            { name: 'Kano', countryId: country.id },
            { name: 'Katsina', countryId: country.id },
            { name: 'Kebbi', countryId: country.id },
            { name: 'Kogi', countryId: country.id },
            { name: 'Kwara', countryId: country.id },
            { name: 'Lagos', countryId: country.id },
            { name: 'Nasarawa', countryId: country.id },
            { name: 'Niger', countryId: country.id },
            { name: 'Ogun', countryId: country.id },
            { name: 'Ondo', countryId: country.id },
            { name: 'Osun', countryId: country.id },
            { name: 'Oyo', countryId: country.id },
            { name: 'Plateau', countryId: country.id },
            { name: 'Rivers', countryId: country.id },
            { name: 'Sokoto', countryId: country.id },
            { name: 'Taraba', countryId: country.id },
            { name: 'Yobe', countryId: country.id },
            { name: 'Zamfara', countryId: country.id },
          ],
        });
        const state = await tx.state.findFirst({
          where: { name: 'Enugu', countryId: country.id },
        });

        await tx.user.create({
          data: {
            email: this.config.getOrThrow('ADMIN_EMAIL') as string,
            firstName: 'Super',
            lastName: 'Admin',
            companyName: 'Energhx',
            sex: Gender.MALE,
            streetNumber: 0,
            postalCode: 0,
            street: '',
            city: '',
            countryId: country.id,
            stateId: state!.id,
            password: hashedPassword,
            userType: UserRole.SUPER_ADMIN,
          },
        });
      });
      Logger.log('Super Admin created successfully.');
    } else {
      Logger.log('Super Admin already exists.');
    }
  }
}
