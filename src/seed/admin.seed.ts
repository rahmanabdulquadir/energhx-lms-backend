// import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { LibService } from 'src/lib/lib.service';
// import { Gender, UserRole } from '@prisma/client';
// import { PrismaService } from 'src/prisma/prisma.service';

// @Injectable()
// export class UserSeeder implements OnModuleInit {
//   constructor(
//     private readonly config: ConfigService,
//     private readonly lib: LibService,
//     private readonly prisma: PrismaService,
//   ) {}

//   async onModuleInit() {
//     await this.seedAdmin();
//   }

//   async seedAdmin() {
//     const adminExists = await this.prisma.user.findFirst({
//       where: {
//         userType: 'SUPER_ADMIN',
//       },
//     });

//     if (!adminExists) {
//       const hashedPassword = await this.lib.hashPassword({
//         password: this.config.getOrThrow('ADMIN_PASS') as string,
//         round: 6,
//       });
//       await this.prisma.user.create({
//         data: {
//           email: this.config.getOrThrow('ADMIN_EMAIL') as string,
//           firstName: 'Super',
//           lastName: 'Admin',
//           companyName: 'Super Admin Company',
//           sex: Gender.MALE,
//           streetNumber: 0,
//           postalCode: 0,
//           street: '',
//           city: '',
//           countryId: '',
//           stateId: '',
//           password: hashedPassword,
//           userType: UserRole.SUPER_ADMIN,
//         },
//       });
//       Logger.log('Super Admin created successfully.');
//     } else {
//       Logger.log('Super Admin already exists.');
//     }
//   }
// }
