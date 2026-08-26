import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const OPEN_STATUSES = ['completed', 'completed_late'];

@Injectable()
export class TasksService {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly notifications: NotificationsService,
  ) { }

  async create(dto: CreateTaskDto, assignedById: string) {
    const id = uuid();
    const [row] = await this.neo4j.run(
      `CREATE (t:Task {
        id: $id, title: $title, description: $description,
        status: 'not_started', priority: $priority, deadline: datetime($deadline),
        createdAt: datetime()
      })
      WITH t
      OPTIONAL MATCH (assignee:User {id: $assignedToId})
      FOREACH (_ IN CASE WHEN assignee IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:ASSIGNED_TO]->(assignee))
      WITH t
      OPTIONAL MATCH (assigner:User {id: $assignedById})
      FOREACH (_ IN CASE WHEN assigner IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:ASSIGNED_BY]->(assigner))
      WITH t
      OPTIONAL MATCH (d:Department {id: $departmentId})
      FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:BELONGS_TO]->(d))
      RETURN t`,
      {
        id,
        title: dto.title,
        description: dto.description ?? null,
        assignedToId: dto.assignedToId,
        assignedById,
        departmentId: dto.departmentId ?? null,
        priority: dto.priority ?? 'medium',
        deadline: dto.deadline,
      },
    );

    if (dto.dependsOnTaskIds && dto.dependsOnTaskIds.length > 0) {
      await this.neo4j.run(
        `MATCH (t:Task {id: $id})
         UNWIND $dependsOnTaskIds AS depId
         MATCH (dep:Task {id: depId})
         MERGE (t)-[:DEPENDS_ON]->(dep)`,
        { id, dependsOnTaskIds: dto.dependsOnTaskIds },
      );
    }

    if (dto.assignedToId && dto.assignedToId !== assignedById) {
      await this.notifications.create(
        dto.assignedToId,
        'Task Assigned',
        `You have been assigned: ${dto.title}`,
        'task_assigned',
        'info',
        id,
      );
    }

    return row?.t ?? { id, title: dto.title, status: 'not_started', priority: dto.priority ?? 'medium' };
  }

  list(
    filters: { status?: string; priority?: string; departmentId?: string; assignedToId?: string },
    caller?: { id: string; role: string },
  ) {
    const isSupervisor = caller?.role === 'supervisor';
    const isStaff = caller?.role === 'staff';

    if (isSupervisor) {
      // Graph query: caller's tasks + tasks of people SUPERVISED_BY caller.
      return this.neo4j.run(
        `MATCH (me:User {id: $callerId})
         OPTIONAL MATCH (report:User)-[:SUPERVISED_BY]->(me)
         WITH me, collect(report.id) + [me.id] AS visibleIds
         MATCH (t:Task)-[:ASSIGNED_TO]->(assignee:User)
         WHERE assignee.id IN visibleIds
           AND ($status IS NULL OR t.status = $status)
           AND ($priority IS NULL OR t.priority = $priority)
         OPTIONAL MATCH (t)-[:BELONGS_TO]->(d:Department)
         WHERE ($departmentId IS NULL OR d.id = $departmentId)
         OPTIONAL MATCH (t)-[:ASSIGNED_BY]->(assigner:User)
         RETURN DISTINCT t, assignee { .id, .firstName, .lastName, .email } AS assignee,
                assigner { .id, .firstName, .lastName } AS assigner, d
         ORDER BY t.deadline`,
        {
          callerId: caller.id,
          status: filters.status ?? null,
          priority: filters.priority ?? null,
          departmentId: filters.departmentId ?? null,
        },
        'READ',
      );
    }

    if (isStaff) {
      return this.neo4j.run(
        `MATCH (t:Task)-[:ASSIGNED_TO]->(assignee:User {id: $callerId})
         OPTIONAL MATCH (t)-[:BELONGS_TO]->(d:Department)
         OPTIONAL MATCH (t)-[:ASSIGNED_BY]->(assigner:User)
         WHERE ($status IS NULL OR t.status = $status)
           AND ($priority IS NULL OR t.priority = $priority)
         RETURN t, assignee { .id, .firstName, .lastName, .email } AS assignee,
                assigner { .id, .firstName, .lastName } AS assigner, d
         ORDER BY t.deadline`,
        {
          callerId: caller.id,
          status: filters.status ?? null,
          priority: filters.priority ?? null,
        },
        'READ',
      );
    }

    return this.neo4j.run(
      `MATCH (t:Task)-[:ASSIGNED_TO]->(assignee:User)
       OPTIONAL MATCH (t)-[:BELONGS_TO]->(d:Department)
       OPTIONAL MATCH (t)-[:ASSIGNED_BY]->(assigner:User)
       WHERE ($status IS NULL OR t.status = $status)
         AND ($priority IS NULL OR t.priority = $priority)
         AND ($departmentId IS NULL OR d.id = $departmentId)
         AND ($assignedToId IS NULL OR assignee.id = $assignedToId)
       RETURN t, assignee { .id, .firstName, .lastName, .email } AS assignee,
              assigner { .id, .firstName, .lastName } AS assigner, d
       ORDER BY t.deadline`,
      {
        status: filters.status ?? null,
        priority: filters.priority ?? null,
        departmentId: filters.departmentId ?? null,
        assignedToId: filters.assignedToId ?? null,
      },
      'READ',
    );
  }

  findById(id: string) {
    return this.neo4j
      .run(
        `MATCH (t:Task {id: $id})
         OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(assignee:User)
         OPTIONAL MATCH (t)-[:ASSIGNED_BY]->(assigner:User)
         OPTIONAL MATCH (t)-[:BELONGS_TO]->(d:Department)
         OPTIONAL MATCH (t)-[:DEPENDS_ON]->(dep:Task)
         OPTIONAL MATCH (blocked:Task)-[:DEPENDS_ON]->(t)
         WITH t, assignee, assigner, d,
              collect(DISTINCT dep { .id, .title, .status, .priority }) AS rawDeps,
              collect(DISTINCT blocked { .id, .title, .status, .priority }) AS rawDependents
         WITH t, assignee, assigner, d,
              [x IN rawDeps WHERE x.id IS NOT NULL] AS dependencies,
              [x IN rawDependents WHERE x.id IS NOT NULL] AS dependents
         RETURN t, assignee { .id, .firstName, .lastName, .email } AS assignee,
                assigner { .id, .firstName, .lastName } AS assigner, d,
                dependencies, dependents,
                (size(dependencies) = 0 OR all(d IN dependencies WHERE d.status IN $openStatuses)) AS ready`,
        { id, openStatuses: OPEN_STATUSES },
        'READ',
      )
      .then((rows) => rows[0] ?? null);
  }

  async getStats(caller?: { id: string; role: string }) {
    const isSupervisor = caller?.role === 'supervisor';
    const isStaff = caller?.role === 'staff';

    if (isSupervisor && caller?.id) {
      const [row] = await this.neo4j.run(
        `MATCH (me:User {id: $callerId})
         OPTIONAL MATCH (report:User)-[:SUPERVISED_BY]->(me)
         WITH me, collect(report.id) + [me.id] AS visibleIds
         MATCH (t:Task)-[:ASSIGNED_TO]->(assignee:User)
         WHERE assignee.id IN visibleIds
         RETURN count(t) AS total,
                count(CASE WHEN t.status = 'completed' THEN 1 END) AS completed,
                count(CASE WHEN t.status = 'completed_late' THEN 1 END) AS completedLate,
                count(CASE WHEN t.status = 'in_progress' THEN 1 END) AS inProgress,
                count(CASE WHEN t.status = 'overdue' THEN 1 END) AS overdue,
                count(CASE WHEN t.status = 'not_started' THEN 1 END) AS notStarted`,
        { callerId: caller.id },
        'READ',
      );
      return row ?? { total: 0, completed: 0, completedLate: 0, inProgress: 0, overdue: 0, notStarted: 0 };
    }

    if (isStaff && caller?.id) {
      const [row] = await this.neo4j.run(
        `MATCH (t:Task)-[:ASSIGNED_TO]->(assignee:User {id: $callerId})
         RETURN count(t) AS total,
                count(CASE WHEN t.status = 'completed' THEN 1 END) AS completed,
                count(CASE WHEN t.status = 'completed_late' THEN 1 END) AS completedLate,
                count(CASE WHEN t.status = 'in_progress' THEN 1 END) AS inProgress,
                count(CASE WHEN t.status = 'overdue' THEN 1 END) AS overdue,
                count(CASE WHEN t.status = 'not_started' THEN 1 END) AS notStarted`,
        { callerId: caller.id },
        'READ',
      );
      return row ?? { total: 0, completed: 0, completedLate: 0, inProgress: 0, overdue: 0, notStarted: 0 };
    }

    const [row] = await this.neo4j.run(
      `MATCH (t:Task)
       RETURN count(t) AS total,
              count(CASE WHEN t.status = 'completed' THEN 1 END) AS completed,
              count(CASE WHEN t.status = 'completed_late' THEN 1 END) AS completedLate,
              count(CASE WHEN t.status = 'in_progress' THEN 1 END) AS inProgress,
              count(CASE WHEN t.status = 'overdue' THEN 1 END) AS overdue,
              count(CASE WHEN t.status = 'not_started' THEN 1 END) AS notStarted`,
      {},
      'READ',
    );
    return row ?? { total: 0, completed: 0, completedLate: 0, inProgress: 0, overdue: 0, notStarted: 0 };
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.neo4j.run(
      `MATCH (t:Task {id: $id})
       SET t.title = coalesce($title, t.title),
           t.description = coalesce($description, t.description),
           t.priority = coalesce($priority, t.priority),
           t.deadline = CASE WHEN $deadline IS NOT NULL THEN datetime($deadline) ELSE t.deadline END`,
      {
        id,
        title: dto.title ?? null,
        description: dto.description ?? null,
        priority: dto.priority ?? null,
        deadline: dto.deadline ?? null,
      },
    );

    if (dto.assignedToId) {
      await this.neo4j.run(
        `MATCH (t:Task {id: $id})
         OPTIONAL MATCH (t)-[old:ASSIGNED_TO]->(:User)
         DELETE old
         WITH t
         MATCH (u:User {id: $assignedToId})
         MERGE (t)-[:ASSIGNED_TO]->(u)`,
        { id, assignedToId: dto.assignedToId },
      );
    }

    if (dto.departmentId !== undefined) {
      await this.neo4j.run(
        `MATCH (t:Task {id: $id})
         OPTIONAL MATCH (t)-[old:BELONGS_TO]->(:Department)
         DELETE old
         WITH t
         OPTIONAL MATCH (d:Department {id: $departmentId})
         FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:BELONGS_TO]->(d))`,
        { id, departmentId: dto.departmentId ?? null },
      );
    }

    return this.findById(id);
  }

  async updateStatus(id: string, status: string) {
    const VALID_STATUSES = ['not_started', 'in_progress', 'completed', 'completed_late', 'overdue'];
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status "${status}". Must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (status === 'in_progress') {
      const task = await this.findById(id);
      if (task?.t?.status === 'overdue') {
        throw new BadRequestException('An overdue task cannot be moved to in_progress');
      }
    }
    if (status === 'completed' || status === 'in_progress') {
      const ready = await this.readyToStart(id);
      if (!ready) {
        throw new BadRequestException(
          'This task is blocked by incomplete dependencies',
        );
      }
    }
    await this.neo4j.run(
      `MATCH (t:Task {id: $id})
       SET t.status = CASE
             WHEN $status = 'completed' AND t.status = 'overdue' THEN 'completed_late'
             ELSE $status
           END,
           t.completedAt = CASE
             WHEN $status = 'completed' THEN datetime()
             ELSE t.completedAt
           END`,
      { id, status },
    );

    if (status === 'completed' || status === 'completed_late') {
      try {
        const [taskInfo] = await this.neo4j.run(
          `MATCH (t:Task {id: $id})
           OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(assignee:User)
           OPTIONAL MATCH (t)-[:ASSIGNED_BY]->(assigner:User)
           RETURN t.title AS title, assigner.id AS assignerId, assignee.id AS assigneeId,
                  assignee.firstName + ' ' + assignee.lastName AS assigneeName`,
          { id },
          'READ',
        );
        if (taskInfo?.assignerId && taskInfo.assignerId !== taskInfo?.assigneeId) {
          await this.notifications.create(
            taskInfo.assignerId,
            'Task Completed',
            `${taskInfo.assigneeName || 'A team member'} completed "${taskInfo.title}"`,
            'task_completed',
            'success',
            id,
          );
        }
      } catch {
      }
    }
  }

  async addDependency(taskId: string, dependsOnTaskId: string) {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }
    const [row] = await this.neo4j.run(
      `MATCH (would:Task {id: $dependsOnTaskId})-[:DEPENDS_ON*1..20]->(t:Task {id: $taskId})
       RETURN count(t) AS cycles`,
      { taskId, dependsOnTaskId },
      'READ',
    );
    if (row && row.cycles > 0) {
      throw new BadRequestException('That dependency would create a cycle');
    }
    await this.neo4j.run(
      `MATCH (t:Task {id: $taskId}), (dep:Task {id: $dependsOnTaskId})
       MERGE (t)-[:DEPENDS_ON]->(dep)`,
      { taskId, dependsOnTaskId },
    );
  }

  async removeDependency(taskId: string, dependsOnTaskId: string) {
    await this.neo4j.run(
      `MATCH (t:Task {id: $taskId})-[r:DEPENDS_ON]->(dep:Task {id: $dependsOnTaskId})
       DELETE r`,
      { taskId, dependsOnTaskId },
    );
  }

  async transitiveBlockers(taskId: string) {
    return this.neo4j.run(
      `MATCH (t:Task {id: $taskId})-[:DEPENDS_ON*1..20]->(blocker:Task)
       RETURN DISTINCT blocker`,
      { taskId },
      'READ',
    );
  }

  async readyToStart(taskId: string): Promise<boolean> {
    const [row] = await this.neo4j.run(
      `MATCH (t:Task {id: $taskId})
       OPTIONAL MATCH (t)-[:DEPENDS_ON]->(dep:Task)
       WITH t, collect(dep) AS deps
       RETURN size(deps) = 0 OR all(d IN deps WHERE d.status IN $openStatuses) AS ready`,
      { taskId, openStatuses: OPEN_STATUSES },
      'READ',
    );
    return row?.ready ?? true;
  }

  async delete(id: string) {
    await this.neo4j.run(`MATCH (t:Task {id: $id}) DETACH DELETE t`, { id });
    return { message: 'Task deleted' };
  }

  async addSubtask(taskId: string, title: string, order: number) {
    const id = uuid();
    await this.neo4j.run(
      `MATCH (t:Task {id: $taskId})
       CREATE (s:SubTask {id: $id, title: $title, isCompleted: false, order: $order})
       MERGE (t)-[:HAS_SUBTASK]->(s)`,
      { taskId, id, title, order },
    );
    return { id, title, isCompleted: false, order };
  }

  async toggleSubtask(id: string, isCompleted: boolean) {
    await this.neo4j.run(`MATCH (s:SubTask {id: $id}) SET s.isCompleted = $isCompleted`, {
      id,
      isCompleted,
    });
  }

  async deleteSubtask(id: string) {
    await this.neo4j.run(`MATCH (s:SubTask {id: $id}) DETACH DELETE s`, { id });
    return { message: 'Subtask deleted' };
  }

  listSubtasks(taskId: string) {
    return this.neo4j.run(
      `MATCH (:Task {id: $taskId})-[:HAS_SUBTASK]->(s:SubTask)
       RETURN s ORDER BY s.order`,
      { taskId },
      'READ',
    );
  }
}
