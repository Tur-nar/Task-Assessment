import { IsIn, IsISO8601, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTargetDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsIn(['individual', 'team'])
  type: 'individual' | 'team';

  @IsNumber()
  targetValue: number;

  @IsISO8601()
  deadline: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
