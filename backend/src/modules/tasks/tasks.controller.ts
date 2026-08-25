import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post()
  @Roles('super_admin', 'admin', 'supervisor')
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasks.create(dto, req.user.id);
  }

  @Get()
  list(
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('departmentId') departmentId?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.tasks.list({ status, priority, departmentId, assignedToId });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasks.findById(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasks.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  delete(@Param('id') id: string) {
    return this.tasks.delete(id);
  }

  // ---- Dependencies ----

  @Post(':id/dependencies')
  @Roles('super_admin', 'admin', 'supervisor')
  addDependency(@Param('id') id: string, @Body('dependsOnTaskId') dependsOnTaskId: string) {
    return this.tasks.addDependency(id, dependsOnTaskId);
  }

  @Delete(':id/dependencies/:dependsOnTaskId')
  @Roles('super_admin', 'admin', 'supervisor')
  removeDependency(
    @Param('id') id: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    return this.tasks.removeDependency(id, dependsOnTaskId);
  }

  @Get(':id/blockers')
  blockers(@Param('id') id: string) {
    return this.tasks.transitiveBlockers(id);
  }

  @Get(':id/ready')
  ready(@Param('id') id: string) {
    return this.tasks.readyToStart(id);
  }

  // ---- Sub-tasks ----

  @Get(':id/subtasks')
  subtasks(@Param('id') id: string) {
    return this.tasks.listSubtasks(id);
  }

  @Post(':id/subtasks')
  @Roles('super_admin', 'admin', 'supervisor')
  addSubtask(
    @Param('id') id: string,
    @Body('title') title: string,
    @Body('order') order: number,
  ) {
    return this.tasks.addSubtask(id, title, order ?? 0);
  }

  @Patch('subtasks/:subtaskId')
  toggleSubtask(
    @Param('subtaskId') subtaskId: string,
    @Body('isCompleted') isCompleted: boolean,
  ) {
    return this.tasks.toggleSubtask(subtaskId, isCompleted);
  }
}
