import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class CreateDepositDto {
  @IsNumberString()
  amount: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
