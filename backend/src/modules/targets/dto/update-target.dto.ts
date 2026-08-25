import { IsIn, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateTargetDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['individual', 'team'])
  type?: 'individual' | 'team';

  @IsOptional()
  @IsNumber()
  targetValue?: number;

  @IsOptional()
  @IsISO8601()
  deadline?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
