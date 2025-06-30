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
    await this.seedCountriesAndStates();
    await this.seedAdmin();
  }

  private async seedCountriesAndStates() {
    const countryData = [
      {
        id: 'ac72f1fb-a065-4e9a-bab3-0e28370f2c1f',
        name: 'Canada',
        code: 'CAN',
        states: [
          { id: '09458543-8b00-4117-844d-bdd8c812e754', name: 'Nova Scotia' },
          { id: '19aceb1d-6da0-4ba0-ae3a-8ee299035e03', name: 'Quebec' },
          {
            id: '3226791b-6c99-4f36-aaf4-4d62d2250967',
            name: 'British Columbia',
          },
          { id: '527e4c0c-8489-4d6b-8e78-6e53b43efe84', name: 'Manitoba' },
          { id: '64c01938-fdd1-4194-a370-66e672ad8981', name: 'New Brunswick' },
          {
            id: '7139dcdb-3737-4bf2-a592-d8cdfb967078',
            name: 'Northwest Territories',
          },
          { id: 'abe3c0cb-372c-40da-ad27-0f914d227b2c', name: 'Alberta' },
          {
            id: 'ba2df3f0-59ba-45de-8ec8-0e6e7c884bcb',
            name: 'Prince Edward Island',
          },
          {
            id: 'bad56106-f863-4e2e-8fe2-b1b9a91ef926',
            name: 'Newfoundland and Labrador',
          },
          { id: 'cc1e8813-bf14-48f8-b7ee-efd3a989a7a9', name: 'Ontario' },
          { id: 'd1195cfa-b7cf-4158-af30-ed28a8da6a7e', name: 'Saskatchewan' },
          { id: 'dadfceaf-ef04-40c8-a4f9-1782c01cc7c4', name: 'Yukon' },
        ],
      },
      {
        id: 'bdaaa468-c841-4f22-9491-9447cf98d548',
        name: 'United States',
        code: 'UNI',
        states: [
          { id: '029388e3-1eb0-44a9-813f-a8daea710d54', name: 'Wisconsin' },
          { id: '0618f096-33d4-4537-b250-cec955616fc4', name: 'Nebraska' },
          { id: '09fb2207-a5de-46a8-9d85-574fcb50be68', name: 'Tennessee' },
          { id: '0b132e76-6f29-4359-be3e-54dce85a0459', name: 'Washington' },
          { id: '0cdf8e0a-c201-4611-b01f-d5c97aacdde9', name: 'Illinois' },
          { id: '0fbea895-6039-4d45-b264-6b80549dcf1a', name: 'Massachusetts' },
          { id: '1311911a-98ab-48a5-aa61-f7826e3c8510', name: 'Virginia' },
          { id: '15456573-a208-464c-84a8-b92ccbcfbe00', name: 'Minnesota' },
          { id: '155a1f03-a4ae-4161-a233-bdf2b8164338', name: 'Montana' },
          { id: '182287f2-c028-48d5-a871-1fdd29885f44', name: 'Delaware' },
          { id: '1beaffca-903e-4f01-99b8-212aa1228891', name: 'Kentucky' },
          { id: '24a829f8-2b98-4c6b-8f7c-787588ccca5b', name: 'North Dakota' },
          { id: '2827c011-721e-48f8-9c42-a002a0aaa1d4', name: 'Vermont' },
          { id: '2d0edaa6-beb8-4381-965c-3c9712537328', name: 'Florida' },
          { id: '2edc8a4c-4683-453a-b08d-955a4f94b33f', name: 'Nevada' },
          { id: '3acc1d09-740b-4a6b-abc7-df77ab036c0e', name: 'Alabama' },
          { id: '409d989f-c80b-49e5-9449-c8e4af63bd95', name: 'West Virginia' },
          { id: '4741b4cc-70c1-43b3-8ff2-dd2bd071b3c4', name: 'Alaska' },
          { id: '4dbb2942-9b01-4f21-8a34-418a45ff2bf9', name: 'Georgia' },
          { id: '54abf350-6fd4-423a-b1c1-859d44268e70', name: 'California' },
          { id: '5539c748-be06-451f-9386-ec326952aed4', name: 'New Mexico' },
          { id: '579cc56e-65ca-4c74-b0f1-280210bba4a5', name: 'Pennsylvania' },
          { id: '5ca39c70-b7cc-4122-8ded-810e4e5bf1e9', name: 'Michigan' },
          { id: '62e6eb56-5dc0-4967-9fdf-1fd4bd2a0bf3', name: 'New Hampshire' },
          { id: '67dcd641-8a88-4e67-9067-189f1982de6b', name: 'Hawaii' },
          { id: '68c8b58a-7132-4b8b-9950-17838e26cc62', name: 'Arkansas' },
          { id: '6a716797-b2cb-435f-948c-8081ff441ff6', name: 'Colorado' },
          { id: '6bcfc5cd-201f-4461-aafc-f10d03b5949f', name: 'Ohio' },
          { id: '79481997-4afe-4f64-a73c-c0fa24cabb81', name: 'South Dakota' },
          { id: '7d5f2ba8-31b0-445b-a298-58a8e18c8f0f', name: 'Kansas' },
          { id: '84ea6d9b-c238-4169-af03-e0994f223eea', name: 'Texas' },
          { id: '85bb8d26-a2e7-4126-adcb-de9aa1c795af', name: 'Iowa' },
          { id: '866431e0-0745-4d00-919d-205dbe062bea', name: 'Rhode Island' },
          { id: '963fe9ca-d19c-443d-b1ca-f8f05706e3f2', name: 'Maryland' },
          { id: 'a2d949e0-8db9-47af-985f-29fd0bc32ea3', name: 'Louisiana' },
          { id: 'af43d044-bd09-4c04-a4e3-41c99038b093', name: 'Oregon' },
          { id: 'af982ed2-3a97-4551-9d0c-e0c9f9a3dbbf', name: 'Missouri' },
          { id: 'b45b37cb-067b-4bf2-9b8a-e329fc3c7235', name: 'New Jersey' },
          { id: 'b5967e15-87d7-495d-b463-d4a068411c1f', name: 'Wyoming' },
          {
            id: 'c98482e0-1de6-49c9-9adf-0534f7a6df93',
            name: 'South Carolina',
          },
          { id: 'd4ebaaaf-e447-46ef-84cc-5e1717b02c27', name: 'Mississippi' },
          { id: 'dd630ab2-1eca-41eb-a193-f54519045887', name: 'New York' },
          { id: 'e7fd35db-fe90-4311-9be5-5bc5604a02a4', name: 'Idaho' },
          { id: 'ee9c3c4f-f32e-4e14-a06e-d0b15dafb660', name: 'Arizona' },
          { id: 'f20cdf4e-1ba4-49f5-a97b-e661a3db30c8', name: 'Maine' },
          { id: 'fa412a88-bda9-47d9-98e3-db8c547df538', name: 'Utah' },
          { id: 'fc65e17f-0560-4d78-8a3d-e8bff6c93557', name: 'Indiana' },
          { id: 'fc92e98b-e30d-4d8d-96d0-68a0ebfb6ecc', name: 'Connecticut' },
          { id: 'ff2558a2-5a7c-4037-b339-e05dac4d0115', name: 'Oklahoma' },
          {
            id: 'ffd22db7-c66b-41a6-8c6e-6f27da875c0e',
            name: 'North Carolina',
          },
        ],
      },
    ];

    for (const country of countryData) {
      const exists = await this.prisma.country.findUnique({
        where: { id: country.id },
      });
      if (!exists) {
        await this.prisma.country.create({
          data: {
            id: country.id,
            name: country.name,
            code: country.code,
            states: {
              createMany: {
                data: country.states.map((state) => ({
                  id: state.id,
                  name: state.name,
                })),
              },
            },
          },
        });
        Logger.log(
          `Seeded ${country.name} with ${country.states.length} states.`,
        );
      } else {
        Logger.log(`${country.name} already exists.`);
      }
    }
  }

  async seedAdmin() {
    const adminExists = await this.prisma.user.findFirst({
      where: { userType: 'SUPER_ADMIN' },
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
            states: {
              create: [
                { name: 'Abia' },
                { name: 'Adamawa' },
                { name: 'Akwa Ibom' },
                { name: 'Anambra' },
                { name: 'Bauchi' },
                { name: 'Bayelsa' },
                { name: 'Benue' },
                { name: 'Borno' },
                { name: 'Cross River' },
                { name: 'Delta' },
                { name: 'Ebonyi' },
                { name: 'Enugu' },
                { name: 'Edo' },
                { name: 'Ekiti' },
                { name: 'Gombe' },
                { name: 'Imo' },
                { name: 'Jigawa' },
                { name: 'Kaduna' },
                { name: 'Kano' },
                { name: 'Katsina' },
                { name: 'Kebbi' },
                { name: 'Kogi' },
                { name: 'Kwara' },
                { name: 'Lagos' },
                { name: 'Nasarawa' },
                { name: 'Niger' },
                { name: 'Ogun' },
                { name: 'Ondo' },
                { name: 'Osun' },
                { name: 'Oyo' },
                { name: 'Plateau' },
                { name: 'Rivers' },
                { name: 'Sokoto' },
                { name: 'Taraba' },
                { name: 'Yobe' },
                { name: 'Zamfara' },
              ],
            },
          },
          include: { states: true },
        });

        const state = country.states.find((s) => s.name === 'Enugu');

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
            isVerified: true,
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
