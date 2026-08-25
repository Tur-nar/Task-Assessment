import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEntryDto {
  @IsNumber()
  value: number;

  @IsOptional()
  @IsString()
  note?: string;
}
