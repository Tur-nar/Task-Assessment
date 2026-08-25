import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { CreateTargetDto } from './dto/create-target.dto';
import { UpdateTargetDto } from './dto/update-target.dto';

@Injectable()
export class TargetsService {
  constructor(private readonly neo4j: Neo4jService) {}

  private computeStatus(currentValue: number, targetValue: number, deadline: string): string {
    if (currentValue >= targetValue) return 'completed';
    const now = new Date();
    const dl = new Date(deadline);
    if (dl < now) return 'missed';
    const daysLeft = (dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const progress = targetValue > 0 ? currentValue / targetValue : 0;
    if (daysLeft <= 3 && progress < 0.75) return 'at_risk';
    return 'on_track';
  }

  async create(dto: CreateTargetDto, createdById: string) {
    const id = uuid();
    const [row] = await this.neo4j.run(
      `CREATE (t:Target {
        id: $id, title: $title, description: $description,
        type: $type, targetValue: $targetValue,
        deadline: datetime($deadline), createdAt: datetime()
      })
      WITH t
      MATCH (creator:User {id: $createdById})
      MERGE (t)-[:CREATED_BY]->(creator)
      WITH t
      OPTIONAL MATCH (assignee:User {id: $assignedToId})
      FOREACH (_ IN CASE WHEN assignee IS NOT NULL THEN [1] ELSE [] END |
        MERGE (t)-[:ASSIGNED_TO]->(assignee)
      )
      WITH t
      OPTIONAL MATCH (d:Department {id: $departmentId})
      FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END |
        MERGE (t)-[:FOR_DEPARTMENT]->(d)
      )
      RETURN t`,
      {
        id,
        title: dto.title,
        description: dto.description ?? null,
        type: dto.type,
        targetValue: dto.targetValue,
        deadline: dto.deadline,
        createdById,
        assignedToId: dto.assignedToId ?? null,
        departmentId: dto.departmentId ?? null,
      },
    );
    return row.t;
  }

  async list(filters: { type?: string; status?: string; departmentId?: string }) {
    const rows = await this.neo4j.run(
      `MATCH (t:Target)
       OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(assignee:User)
       OPTIONAL MATCH (t)-[:FOR_DEPARTMENT]->(d:Department)
       OPTIONAL MATCH (t)-[:CREATED_BY]->(creator:User)
       OPTIONAL MATCH (e:TargetEntry)-[:LOGGED_FOR]->(t)
       WITH t, assignee, d, creator,
            CASE WHEN sum(e.value) IS NULL THEN 0 ELSE sum(e.value) END AS currentValue
       WHERE ($type IS NULL OR t.type = $type)
         AND ($departmentId IS NULL OR d.id = $departmentId)
       RETURN t, currentValue,
              assignee { .id, .firstName, .lastName, .email } AS assignee,
              d, creator { .id, .firstName, .lastName } AS creator
       ORDER BY t.deadline`,
      {
        type: filters.type ?? null,
        departmentId: filters.departmentId ?? null,
      },
      'READ',
    );

    return rows.map((row: any) => {
      const status = this.computeStatus(
        row.currentValue,
        row.t.targetValue,
        row.t.deadline,
      );
      return {
        ...row.t,
        currentValue: row.currentValue,
        status,
        assignee: row.assignee ?? null,
        department: row.d ?? null,
        creator: row.creator ?? null,
      };
    });
  }

  async findById(id: string) {
    const [row] = await this.neo4j.run(
      `MATCH (t:Target {id: $id})
       OPTIONAL MATCH (t)-[:ASSIGNED_TO]->(assignee:User)
       OPTIONAL MATCH (t)-[:FOR_DEPARTMENT]->(d:Department)
       OPTIONAL MATCH (t)-[:CREATED_BY]->(creator:User)
       OPTIONAL MATCH (e:TargetEntry)-[:LOGGED_FOR]->(t)
       WITH t, assignee, d, creator,
            CASE WHEN sum(e.value) IS NULL THEN 0 ELSE sum(e.value) END AS currentValue
       RETURN t, currentValue,
              assignee { .id, .firstName, .lastName, .email } AS assignee,
              d, creator { .id, .firstName, .lastName } AS creator`,
      { id },
      'READ',
    );
    if (!row) return null;

    const status = this.computeStatus(row.currentValue, row.t.targetValue, row.t.deadline);
    return {
      ...row.t,
      currentValue: row.currentValue,
      status,
      assignee: row.assignee ?? null,
      department: row.d ?? null,
      creator: row.creator ?? null,
    };
  }

  async update(id: string, dto: UpdateTargetDto) {
    await this.neo4j.run(
      `MATCH (t:Target {id: $id})
       SET t.title = coalesce($title, t.title),
           t.description = coalesce($description, t.description),
           t.type = coalesce($type, t.type),
           t.targetValue = coalesce($targetValue, t.targetValue),
           t.deadline = CASE WHEN $deadline IS NOT NULL THEN datetime($deadline) ELSE t.deadline END`,
      {
        id,
        title: dto.title ?? null,
        description: dto.description ?? null,
        type: dto.type ?? null,
        targetValue: dto.targetValue ?? null,
        deadline: dto.deadline ?? null,
      },
    );

    if (dto.assignedToId !== undefined) {
      await this.neo4j.run(
        `MATCH (t:Target {id: $id})
         OPTIONAL MATCH (t)-[old:ASSIGNED_TO]->(:User)
         DELETE old
         WITH t
         OPTIONAL MATCH (u:User {id: $assignedToId})
         FOREACH (_ IN CASE WHEN u IS NOT NULL THEN [1] ELSE [] END |
           MERGE (t)-[:ASSIGNED_TO]->(u)
         )`,
        { id, assignedToId: dto.assignedToId ?? null },
      );
    }

    if (dto.departmentId !== undefined) {
      await this.neo4j.run(
        `MATCH (t:Target {id: $id})
         OPTIONAL MATCH (t)-[old:FOR_DEPARTMENT]->(:Department)
         DELETE old
         WITH t
         OPTIONAL MATCH (d:Department {id: $departmentId})
         FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END |
           MERGE (t)-[:FOR_DEPARTMENT]->(d)
         )`,
        { id, departmentId: dto.departmentId ?? null },
      );
    }

    return this.findById(id);
  }

  // ---- Entries ----

  async addEntry(targetId: string, userId: string, value: number, note?: string) {
    const id = uuid();
    await this.neo4j.run(
      `CREATE (e:TargetEntry {id: $id, value: $value, note: $note, createdAt: datetime()})
       WITH e
       MATCH (t:Target {id: $targetId}), (u:User {id: $userId})
       MERGE (e)-[:LOGGED_FOR]->(t)
       MERGE (e)-[:SUBMITTED_BY]->(u)`,
      {
        id,
        value,
        note: note ?? null,
        targetId,
        userId,
      },
    );
    return { id, value, note };
  }

  async listEntries(targetId: string) {
    return this.neo4j.run(
      `MATCH (e:TargetEntry)-[:LOGGED_FOR]->(:Target {id: $targetId})
       MATCH (e)-[:SUBMITTED_BY]->(u:User)
       RETURN e, u { .id, .firstName, .lastName } AS submitter
       ORDER BY e.createdAt ASC`,
      { targetId },
      'READ',
    );
  }

  async deleteEntry(entryId: string) {
    await this.neo4j.run(`MATCH (e:TargetEntry {id: $entryId}) DETACH DELETE e`, { entryId });
    return { message: 'Entry deleted' };
  }
}
