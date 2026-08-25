import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';

export type NotificationType = 'task_assigned' | 'task_completed' | 'comment_added' | 'target_update' | 'deadline_warning' | 'overdue_alert';
export type Severity = 'info' | 'warning' | 'critical' | 'success';

@Injectable()
export class NotificationsService {
  constructor(private readonly neo4j: Neo4jService) {}

  async create(
    forUserId: string,
    title: string,
    message: string,
    type: NotificationType,
    severity: Severity = 'info',
    relatedTaskId?: string,
  ) {
    const id = uuid();
    await this.neo4j.run(
      `CREATE (n:Notification {
        id: $id, title: $title, message: $message, type: $type,
        severity: $severity, isRead: false, createdAt: datetime()
      })
      WITH n
      MATCH (u:User {id: $forUserId})
      MERGE (n)-[:FOR_USER]->(u)
      WITH n
      OPTIONAL MATCH (t:Task {id: $relatedTaskId})
      FOREACH (_ IN CASE WHEN t IS NOT NULL THEN [1] ELSE [] END |
        MERGE (n)-[:RELATED_TO]->(t)
      )`,
      {
        id,
        title,
        message,
        type,
        severity,
        forUserId,
        relatedTaskId: relatedTaskId ?? null,
      },
    );
    return { id };
  }

  async list(userId: string, filters: { type?: string; isRead?: string }) {
    return this.neo4j.run(
      `MATCH (n:Notification)-[:FOR_USER]->(u:User {id: $userId})
       OPTIONAL MATCH (n)-[:RELATED_TO]->(t:Task)
       WHERE ($type IS NULL OR n.type = $type)
         AND ($isRead IS NULL OR n.isRead = $isReadBool)
       RETURN n, t { .id, .title, .status } AS relatedTask
       ORDER BY n.createdAt DESC`,
      {
        userId,
        type: filters.type ?? null,
        isRead: filters.isRead ?? null,
        isReadBool: filters.isRead === 'true' ? true : filters.isRead === 'false' ? false : null,
      },
      'READ',
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const [row] = await this.neo4j.run(
      `MATCH (n:Notification {isRead: false})-[:FOR_USER]->(u:User {id: $userId})
       RETURN count(n) AS count`,
      { userId },
      'READ',
    );
    return row?.count ?? 0;
  }

  async markRead(id: string) {
    await this.neo4j.run(
      `MATCH (n:Notification {id: $id}) SET n.isRead = true`,
      { id },
    );
    return { message: 'Notification marked as read' };
  }

  async markAllRead(userId: string) {
    await this.neo4j.run(
      `MATCH (n:Notification {isRead: false})-[:FOR_USER]->(u:User {id: $userId})
       SET n.isRead = true`,
      { userId },
    );
    return { message: 'All notifications marked as read' };
  }

  async delete(id: string) {
    await this.neo4j.run(`MATCH (n:Notification {id: $id}) DETACH DELETE n`, { id });
    return { message: 'Notification deleted' };
  }
}
