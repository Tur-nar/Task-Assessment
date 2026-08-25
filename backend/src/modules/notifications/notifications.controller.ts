import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../lib/common/guards/jwt-auth.guard';
import { ResponseMessage } from '../../lib/common/decorators/response-message';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) { }

  @Get()
  @ResponseMessage('Notifications retrieved successfully')
  list(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('isRead') isRead?: string,
  ) {
    return this.notifications.list(req.user.id, { type, isRead });
  }

  @Get('unread-count')
  @ResponseMessage('Unread notification count retrieved successfully')
  unreadCount(@Req() req: any) {
    return this.notifications.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @ResponseMessage('Notification marked as read')
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }

  @Patch('read-all')
  @ResponseMessage('All notifications marked as read')
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.id);
  }

  @Delete(':id')
  @ResponseMessage('Notification deleted successfully')
  delete(@Param('id') id: string) {
    return this.notifications.delete(id);
  }
}
