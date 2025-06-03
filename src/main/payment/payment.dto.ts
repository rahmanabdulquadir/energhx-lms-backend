import { IsString, IsNumber } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  programId: string;

  @IsNumber()
  amount: number;
}
