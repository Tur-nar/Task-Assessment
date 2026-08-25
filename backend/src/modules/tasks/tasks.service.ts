import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const OPEN_STATUSES = ['completed', 'completed_late'];

@Injectable()
export class TasksService {
  constructor(private readonly neo4j: Neo4jService) { }

  async create(dto: CreateTaskDto, assignedById: string) {
    const id = uuid();
    const [row] = await this.neo4j.run(
      `CREATE (t:Task {
        id: $id, title: $title, description: $description,
        status: 'not_started', priority: $priority, deadline: datetime($deadline),
        createdAt: datetime()
      })
      WITH t
      MATCH (assignee:User {id: $assignedToId})
      MERGE (t)-[:ASSIGNED_TO]->(assignee)
      WITH t
      MATCH (assigner:User {id: $assignedById})
      MERGE (t)-[:ASSIGNED_BY]->(assigner)
      WITH t
      OPTIONAL MATCH (d:Department {id: $departmentId})
      FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END | MERGE (t)-[:BELONGS_TO]->(d))
      WITH t
      UNWIND (CASE WHEN $dependsOnTaskIds IS NULL THEN [] ELSE $dependsOnTaskIds END) AS depId
      MATCH (dep:Task {id: depId})
      MERGE (t)-[:DEPENDS_ON]->(dep)
      RETURN DISTINCT t`,
      {
        id,
        title: dto.title,
        description: dto.description ?? null,
        assignedToId: dto.assignedToId,
        assignedById,
        departmentId: dto.departmentId ?? null,
        priority: dto.priority ?? 'medium',
        deadline: dto.deadline,
        dependsOnTaskIds: dto.dependsOnTaskIds ?? null,
      },
    );
    return row.t;
  }

  list(filters: { status?: string; priority?: string; departmentId?: string; assignedToId?: string }) {
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
         WITH t, assignee, assigner, d, collect(dep { .id, .title, .status }) AS dependencies
         RETURN t, assignee { .id, .firstName, .lastName, .email } AS assignee,
                assigner { .id, .firstName, .lastName } AS assigner, d, dependencies`,
        { id },
        'READ',
      )
      .then((rows) => rows[0] ?? null);
  }

  async getStats() {
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
