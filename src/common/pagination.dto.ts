import { IsInt, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Take must be at least 1' })
  @Max(100, { message: 'Take cannot exceed 100' })
  take?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: 'Skip cannot be negative' })
  skip?: number = 0;
}
