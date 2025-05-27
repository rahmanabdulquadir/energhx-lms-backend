import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { CreateCountryDto, CreateStateDto } from './country.dto';
import { CountryService } from './country.service';
import sendResponse from 'src/utils/sendResponse';
import { Response } from 'express';

@Controller('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Post()
  async createCountry(@Res() res: Response, @Body() dto: CreateCountryDto) {
    const result = await this.countryService.createCountry(dto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Country added successfully!',
      data: result,
    });
  }

  @Post('/add-state')
  async addStateToCountry(@Res() res: Response, @Body() dto: CreateStateDto) {
    const result = await this.countryService.addStateToCountry(dto);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'State added to country successfully!',
      data: result,
    });
  }

  @Get()
  async getAllCountries(@Res() res: Response) {
    const result = await this.countryService.getAllCountries();
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'Country fetched successfully!',
      data: result,
    });
  }

  @Get('/:id/states')
  async getStatesOfCountry(@Res() res: Response, @Param('id') id: string) {
    const result = await this.countryService.getStatesOfCountry(id);
    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: 'State of Country fetched successfully!',
      data: result,
    });
  }
}
