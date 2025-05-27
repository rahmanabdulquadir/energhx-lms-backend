import { IsString } from 'class-validator';

export class CreateCountryDto {
  @IsString()
  name: string;

  @IsString()
  code: string;
}

export class CreateStateDto {
  @IsString()
  name: string;

  @IsString()
  countryId: string;
}
