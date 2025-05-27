import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCountryDto, CreateStateDto } from './country.dto';

@Injectable()
export class CountryService {
  constructor(private prisma: PrismaService) {}

  async createCountry(dto: CreateCountryDto) {
    return this.prisma.country.create({ data: dto });
  }

  async addStateToCountry(dto: CreateStateDto) {
    // optional validation if country exists
    const country = await this.prisma.country.findUnique({
      where: { id: dto.countryId },
    });
    if (!country) throw new HttpException('Country not found', 404);

    return this.prisma.state.create({
      data: {
        name: dto.name,
        countryId: dto.countryId,
      },
    });
  }

  async getAllCountries() {
    const country = await this.prisma.country.findMany({
      include: { states: true },
    });
    return country;
  }

  async getStatesOfCountry(countryId: string) {
    const states = await this.prisma.state.findMany({
      where: { countryId },
    });
    return states;
  }
}
