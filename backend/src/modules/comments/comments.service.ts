import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly notifications: NotificationsService,
  ) { }

  async create(taskId: string, userId: string, content: string, parentCommentId?: string) {
    const id = uuid();
    if (parentCommentId) {
      const [parent] = await this.neo4j.run(
        `MATCH (c:TaskComment {id: $parentCommentId})-[:ON_TASK]->(:Task {id: $taskId})
         RETURN c`,
        { parentCommentId, taskId },
        'READ',
      );
      if (!parent) {
        throw new BadRequestException('Parent comment not found on this task');
      }
    }

    const [row] = await this.neo4j.run(
      `CREATE (c:TaskComment {id: $id, content: $content, createdAt: datetime()})
       WITH c
       MATCH (t:Task {id: $taskId}), (u:User {id: $userId})
       MERGE (c)-[:ON_TASK]->(t)
       MERGE (c)-[:AUTHORED_BY]->(u)
       WITH c
       OPTIONAL MATCH (parent:TaskComment {id: $parentCommentId})
       FOREACH (_ IN CASE WHEN parent IS NOT NULL THEN [1] ELSE [] END |
         MERGE (c)-[:REPLY_TO]->(parent))
       WITH c
       MATCH (c)-[:AUTHORED_BY]->(author:User)
       RETURN c, author { .id, .firstName, .lastName, .email } AS author`,
      {
        id,
        content,
        taskId,
        userId,
        parentCommentId: parentCommentId ?? null,
      },
    );

    try {
      // Notify task assignee if the author is not the assignee
      const [taskInfo] = await this.neo4j.run(
        `MATCH (t:Task {id: $taskId})
         OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(assignee:User)
         OPTIONAL MATCH (author:User {id: $userId})
         RETURN t.title AS title, assignee.id AS assigneeId,
                author.firstName + ' ' + author.lastName AS authorName`,
        { taskId, userId },
        'READ',
      );
      if (taskInfo?.assigneeId && taskInfo.assigneeId !== userId) {
        await this.notifications.create(
          taskInfo.assigneeId,
          'New Comment',
          `${taskInfo.authorName || 'Someone'} commented on "${taskInfo.title}"`,
          'comment_added',
          'info',
          taskId,
        );
      }
    } catch {
      // notification should not block comment creation
    }

    return row;
  }

  async listByTask(taskId: string) {
    return this.neo4j.run(
      `MATCH (c:TaskComment)-[:ON_TASK]->(:Task {id: $taskId})
       WHERE NOT (c)-[:REPLY_TO]->(:TaskComment)
       MATCH (c)-[:AUTHORED_BY]->(author:User)
       OPTIONAL MATCH (reply:TaskComment)-[:REPLY_TO]->(c)
       OPTIONAL MATCH (reply)-[:AUTHORED_BY]->(replyAuthor:User)
       WITH c, author, reply, replyAuthor
       ORDER BY reply.createdAt ASC
       WITH c, author,
            collect(CASE WHEN reply IS NOT NULL THEN {
              comment: reply { .* },
              author: replyAuthor { .id, .firstName, .lastName, .email }
            } END) AS replies
       RETURN c, author { .id, .firstName, .lastName, .email } AS author,
              [r IN replies WHERE r IS NOT NULL] AS replies
       ORDER BY c.createdAt ASC`,
      { taskId },
      'READ',
    );
  }

  async delete(commentId: string, userId: string, userRole: string) {
    const [row] = await this.neo4j.run(
      `MATCH (c:TaskComment {id: $commentId})-[:AUTHORED_BY]->(author:User)
       RETURN author.id AS authorId`,
      { commentId },
      'READ',
    );
    if (!row) throw new BadRequestException('Comment not found');

    if (row.authorId !== userId && userRole !== 'super_admin') {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.neo4j.run(
      `MATCH (c:TaskComment {id: $commentId})
       OPTIONAL MATCH (reply:TaskComment)-[:REPLY_TO*1..5]->(c)
       DETACH DELETE reply, c`,
      { commentId },
    );
    return { message: 'Comment deleted' };
  }
}
