import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../lib/common/guards/jwt-auth.guard';
import { ResponseMessage } from '../../lib/common/decorators/response-message';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('api/tasks/:taskId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) { }

  @Post()
  @ResponseMessage('Comment created successfully')
  create(
    @Param('taskId') taskId: string,
    @Req() req: any,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(taskId, req.user.id, dto.content, dto.parentCommentId);
  }

  @Get()
  @ResponseMessage('Task comments retrieved successfully')
  list(@Param('taskId') taskId: string) {
    return this.comments.listByTask(taskId);
  }

  @Delete(':commentId')
  @ResponseMessage('Comment deleted successfully')
  delete(
    @Param('commentId') commentId: string,
    @Req() req: any,
  ) {
    return this.comments.delete(commentId, req.user.id, req.user.role);
  }
}
