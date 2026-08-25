import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { TargetsService } from './targets.service';
import { CreateTargetDto } from './dto/create-target.dto';
import { UpdateTargetDto } from './dto/update-target.dto';
import { CreateEntryDto } from './dto/create-entry.dto';

@Controller('api/targets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TargetsController {
  constructor(private readonly targets: TargetsService) { }

  @Post()
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Target created successfully')
  create(@Body() dto: CreateTargetDto, @Req() req: any) {
    return this.targets.create(dto, req.user.id);
  }

  @Get()
  @ResponseMessage('Targets retrieved successfully')
  list(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.targets.list({ type, status, departmentId });
  }

  @Get(':id')
  @ResponseMessage('Target details retrieved successfully')
  findOne(@Param('id') id: string) {
    return this.targets.findById(id);
  }

  @Put(':id')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Target updated successfully')
  update(@Param('id') id: string, @Body() dto: UpdateTargetDto) {
    return this.targets.update(id, dto);
  }

  // ---- Entries ----

  @Post(':id/entries')
  @ResponseMessage('Target progress entry logged successfully')
  addEntry(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: CreateEntryDto,
  ) {
    return this.targets.addEntry(id, req.user.id, dto.value, dto.note);
  }

  @Get(':id/entries')
  @ResponseMessage('Target progress entries retrieved successfully')
  listEntries(@Param('id') id: string) {
    return this.targets.listEntries(id);
  }

  @Delete(':id/entries/:entryId')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Target progress entry deleted successfully')
  deleteEntry(@Param('entryId') entryId: string) {
    return this.targets.deleteEntry(entryId);
  }
}
