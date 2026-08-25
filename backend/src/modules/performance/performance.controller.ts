import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../lib/common/guards/jwt-auth.guard';
import { RolesGuard } from '../../lib/common/guards/roles.guard';
import { Roles } from '../../lib/common/decorators/roles.decorator';
import { ResponseMessage } from '../../lib/common/decorators/response-message';
import { PerformanceService } from './performance.service';

@Controller('api/performance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PerformanceController {
  constructor(private readonly performance: PerformanceService) { }

  @Get()
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Performance analytics retrieved successfully')
  getAll() {
    return this.performance.getAll();
  }

  @Get('me')
  @ResponseMessage('Own performance retrieved successfully')
  getMe(@Req() req: any) {
    return this.performance.getByUser(req.user.id);
  }

  @Get('department/:id')
  @Roles('super_admin', 'admin', 'supervisor')
  @ResponseMessage('Department performance retrieved successfully')
  getByDepartment(@Param('id') id: string) {
    return this.performance.getByDepartment(id);
  }
}
