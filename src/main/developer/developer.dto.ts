import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ReferenceDto {
  @IsString()
  name: string;

  @IsString()
  document: string;
}

class PublicationDto {
  @IsString()
  publisher: string;

  @IsString()
  title: string;

  @IsString()
  authorList: string;

  @IsString()
  pages: string;

  @IsInt()
  publicationYear: number;
}

class ExperienceDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  title: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}

export class CreateDeveloperProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ReferenceDto)
  reference?: ReferenceDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PublicationDto)
  publications?: PublicationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  experiences?: ExperienceDto[];
}
