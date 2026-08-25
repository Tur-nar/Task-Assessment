import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Controller('api/departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departments: DepartmentsService) {}

  @Get()
  list() {
    return this.departments.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.departments.findById(id);
  }

  @Post()
  @Roles('super_admin', 'admin')
  create(@Body() dto: CreateDepartmentDto) {
    return this.departments.create(dto);
  }

  @Put(':id')
  @Roles('super_admin', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; description?: string; headId?: string },
  ) {
    return this.departments.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  delete(@Param('id') id: string) {
    return this.departments.delete(id);
  }
}
