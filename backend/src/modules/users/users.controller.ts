import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('api/users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  @Roles('super_admin', 'admin')
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  list(
    @Query('role') role?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    return this.users.list({ role, departmentId, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Get(':id/reporting-chain')
  reportingChain(@Param('id') id: string) {
    return this.users.reportingChain(id);
  }

  @Get(':id/team')
  team(@Param('id') id: string) {
    return this.users.teamMembers(id);
  }

  @Patch(':id/status')
  @Roles('super_admin', 'admin')
  setStatus(@Param('id') id: string, @Body('status') status: 'active' | 'inactive') {
    return this.users.setStatus(id, status);
  }

  @Patch('reassign-supervisor')
  @Roles('super_admin', 'admin')
  reassign(
    @Body('memberIds') memberIds: string[],
    @Body('newSupervisorId') newSupervisorId: string,
  ) {
    return this.users.reassignSupervisor(memberIds, newSupervisorId);
  }
}
