import { IsString } from 'class-validator';

export class AcceptBidDto {
  @IsString()
  bidId: string;
}


