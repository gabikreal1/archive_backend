import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SubmitRatingDto {
  @IsString()
  deliveryId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  feedback?: string;
}

