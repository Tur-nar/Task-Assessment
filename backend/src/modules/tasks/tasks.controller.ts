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
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../lib/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../lib/common/guards/roles.guard';
import { Roles } from '../../lib/common/decorators/roles.decorator';
import { ResponseMessage } from '../../lib/common/decorators/response-message';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) { }

  @Post()
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Task created successfully')
  create(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasks.create(dto, req.user.id);
  }

  @Get('stats')
  @ResponseMessage('Task statistics retrieved successfully')
  stats(@Req() req: any) {
    return this.tasks.getStats({ id: req.user.id, role: req.user.role });
  }

  @Get()
  @ResponseMessage('Tasks retrieved successfully')
  list(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('departmentId') departmentId?: string,
    @Query('assignedToId') assignedToId?: string,
  ) {
    return this.tasks.list(
      { status, priority, departmentId, assignedToId },
      { id: req.user.id, role: req.user.role },
    );
  }

  @Get(':id')
  @ResponseMessage('Task details retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.tasks.findById(id);
  }

  @Put(':id')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Task updated successfully')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(id, dto);
  }

  @Patch(':id/status')
  @ResponseMessage('Task status updated successfully')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.tasks.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin')
  @ResponseMessage('Task deleted successfully')
  delete(@Param('id') id: string) {
    return this.tasks.delete(id);
  }

  // ---- Dependencies ----

  @Post(':id/dependencies')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Task dependency added successfully')
  addDependency(@Param('id') id: string, @Body('dependsOnTaskId') dependsOnTaskId: string) {
    return this.tasks.addDependency(id, dependsOnTaskId);
  }

  @Delete(':id/dependencies/:dependsOnTaskId')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Task dependency removed successfully')
  removeDependency(
    @Param('id') id: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    return this.tasks.removeDependency(id, dependsOnTaskId);
  }

  @Get(':id/blockers')
  @ResponseMessage('Task blockers retrieved successfully')
  blockers(@Param('id') id: string) {
    return this.tasks.transitiveBlockers(id);
  }

  @Get(':id/ready')
  @ResponseMessage('Task readiness status retrieved successfully')
  ready(@Param('id') id: string) {
    return this.tasks.readyToStart(id);
  }

  @Get(':id/subtasks')
  @ResponseMessage('Subtasks retrieved successfully')
  subtasks(@Param('id') id: string) {
    return this.tasks.listSubtasks(id);
  }

  @Post(':id/subtasks')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Subtask created successfully')
  addSubtask(
    @Param('id') id: string,
    @Body('title') title: string,
    @Body('order') order: number,
  ) {
    return this.tasks.addSubtask(id, title, order ?? 0);
  }

  @Patch('subtasks/:subtaskId')
  @ResponseMessage('Subtask updated successfully')
  toggleSubtask(
    @Param('subtaskId') subtaskId: string,
    @Body('isCompleted') isCompleted: boolean,
  ) {
    return this.tasks.toggleSubtask(subtaskId, isCompleted);
  }

  @Delete('subtasks/:subtaskId')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Subtask deleted successfully')
  deleteSubtask(@Param('subtaskId') subtaskId: string) {
    return this.tasks.deleteSubtask(subtaskId);
  }
}
