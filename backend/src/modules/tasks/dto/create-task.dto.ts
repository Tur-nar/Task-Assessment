import { IsArray, IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  assignedToId: string;

  @IsOptional()
  @IsIn(['high', 'medium', 'low'])
  priority?: 'high' | 'medium' | 'low';

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsISO8601()
  deadline: string;

  @IsOptional()
  @IsArray()
  dependsOnTaskIds?: string[]; // tasks that must complete before this one can start
}
