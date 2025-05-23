import { IsInt, Min, Max, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class PaginationDto {
  @ApiPropertyOptional({ description: "Number of items to take", minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: "Take must be at least 1" })
  @Max(100, { message: "Take cannot exceed 100" })
  take?: number = 10;

  @ApiPropertyOptional({ description: "Number of items to skip", minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0, { message: "Skip cannot be negative" })
  skip?: number = 0;
}
