import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../lib/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../lib/common/guards/roles.guard';
import { Roles } from '../../lib/common/decorators/roles.decorator';
import { ResponseMessage } from '../../lib/common/decorators/response-message';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Controller('api/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) { }

  @Get()
  @ResponseMessage('Departments retrieved successfully')
  list() {
    return this.departments.list();
  }

  @Get(':id')
  @ResponseMessage('Department details retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.departments.findById(id);
  }

  @Post()
  @Roles('super_admin', 'admin')
  @ResponseMessage('Department created successfully')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto);
  }

  @Put(':id')
  @Roles('super_admin', 'admin')
  @ResponseMessage('Department updated successfully')
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; headId?: string },
  ) {
    return this.departments.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ResponseMessage('Department deleted successfully')
  delete(@Param('id') id: string) {
    return this.departments.delete(id);
  }
}
