import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../lib/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../lib/common/guards/roles.guard';
import { Roles } from '../../lib/common/decorators/roles.decorator';
import { ResponseMessage } from '../../lib/common/decorators/response-message';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) { }

  @Post()
  @Roles('super_admin', 'admin')
  @ResponseMessage('User created successfully')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get('supervisors')
  @ResponseMessage('Supervisors retrieved successfully')
  listSupervisors() {
    return this.users.listSupervisors();
  }

  @Get()
  @ResponseMessage('Users retrieved successfully')
  list(
    @Query('role') role?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.users.list({ role, departmentId, status });
  }

  @Get(':id')
  @ResponseMessage('User details retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Get(':id/reporting-chain')
  @ResponseMessage('Reporting chain retrieved successfully')
  reportingChain(@Param('id') id: string) {
    return this.users.reportingChain(id);
  }

  @Get(':id/team')
  @ResponseMessage('Team members retrieved successfully')
  team(@Param('id') id: string) {
    return this.users.teamMembers(id);
  }

  @Put(':id')
  @Roles('super_admin', 'admin')
  @ResponseMessage('User updated successfully')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin')
  @ResponseMessage('User status updated successfully')
  setStatus(@Param('id') id: string, @Body('status') status: 'active' | 'inactive') {
    return this.users.setStatus(id, status);
  }

  @Patch('reassign-supervisor')
  @Roles('super_admin', 'admin')
  @ResponseMessage('Supervisor reassigned successfully')
  reassign(
    @Body('memberIds') memberIds: string[],
    @Body('newSupervisorId') newSupervisorId: string,
  ) {
    return this.users.reassignSupervisor(memberIds, newSupervisorId);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ResponseMessage('User deleted successfully')
  delete(@Param('id') id: string) {
    return this.users.delete(id);
  }
}
