import { IsString, MinLength } from 'class-validator';

export class SelectExecutorDto {
  @IsString()
  @MinLength(3)
  candidateId: string;
}

