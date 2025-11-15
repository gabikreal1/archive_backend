import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ContactPreferenceMethod {
  EMAIL = 'email',
  PHONE = 'phone',
  WALLET = 'wallet',
  OFFCHAIN = 'offchain',
}

export class BidResponseAnswerDto {
  @IsString()
  id: string;

  @IsString()
  question: string;

  @IsOptional()
  answer?: unknown;
}

export class ContactPreferenceDto {
  @IsEnum(ContactPreferenceMethod)
  method: ContactPreferenceMethod;

  @IsString()
  value: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class AcceptBidDto {
  @IsString()
  bidId: string;

  @IsOptional()
  @IsString()
  answeredAt?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BidResponseAnswerDto)
  answers?: BidResponseAnswerDto[];

  @IsOptional()
  @IsString()
  additionalNotes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactPreferenceDto)
  contactPreference?: ContactPreferenceDto;
}
