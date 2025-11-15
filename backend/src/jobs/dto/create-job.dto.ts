import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum JobDeliverableFormat {
  JSON = 'JSON',
  PDF = 'PDF',
  CSV = 'CSV',
  IMAGE = 'Image',
  DOCUMENT = 'Document',
  CODE = 'Code',
  OTHER = 'Other',
}

export class JobRequirementDto {
  @IsString()
  requirement: string;

  @IsOptional()
  @IsBoolean()
  mandatory?: boolean;
}

export class JobAttachmentDto {
  @IsString()
  name: string;

  @IsString()
  ipfsHash: string;

  @IsString()
  mimeType: string;
}

export class CreateJobDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsISO8601()
  deadline?: string; // ISO string, converted to Date in service

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => JobRequirementDto)
  requirements?: JobRequirementDto[];

  @IsOptional()
  @IsEnum(JobDeliverableFormat)
  deliverableFormat?: JobDeliverableFormat;

  @IsOptional()
  @IsString()
  additionalContext?: string;

  @IsOptional()
  @IsArray()
  @IsUrl(undefined, { each: true })
  referenceLinks?: string[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => JobAttachmentDto)
  attachments?: JobAttachmentDto[];
}
