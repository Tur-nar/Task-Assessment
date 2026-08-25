import { BadRequestException, Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly neo4j: Neo4jService) { }

  async create(dto: CreateDepartmentDto) {
    const id = uuid();
    return await this.neo4j.run(
      `CREATE (d:Department {id: $id, name: $name, description: $description, createdAt: datetime()})
       WITH d
       OPTIONAL MATCH (h:User {id: $headId})
       FOREACH (_ IN CASE WHEN h IS NOT NULL THEN [1] ELSE [] END | MERGE (d)-[:HEADED_BY]->(h))
       RETURN d`,
      {
        id,
        name: dto.name,
        description: dto.description ?? null,
        headId: dto.headId ?? null,
      },
    );
  }

  async list() {
    return await this.neo4j.run(
      `MATCH (d:Department)
       OPTIONAL MATCH (d)-[:HEADED_BY]->(head:User)
       OPTIONAL MATCH (staff:User)-[:MEMBER_OF]->(d)
       OPTIONAL MATCH (t:Task)-[:BELONGS_TO]->(d)
       WITH d, head, count(DISTINCT staff) AS staffCount,
            count(t) AS totalTasks,
            count(CASE WHEN t.status IN ['completed', 'completed_late'] THEN 1 END) AS completedTasks
       RETURN d, head, staffCount, totalTasks, completedTasks`,
      {},
      'READ',
    );
  }

  async findById(id: string) {
    return await this.neo4j
      .run(
        `MATCH (d:Department {id: $id})
         OPTIONAL MATCH (d)-[:HEADED_BY]->(head:User)
         OPTIONAL MATCH (staff:User)-[:MEMBER_OF]->(d)
         RETURN d, head, collect(staff) AS staff`,
        { id },
        'READ',
      )
      .then((rows) => rows[0] ?? null);
  }

  async update(id: string, dto: { name?: string; description?: string; headId?: string }) {
    return await this.neo4j.run(
      `MATCH (d:Department {id: $id})
       SET d.name = coalesce($name, d.name), d.description = coalesce($description, d.description)
       WITH d
       OPTIONAL MATCH (d)-[old:HEADED_BY]->(:User)
       DELETE old
       WITH d
       OPTIONAL MATCH (h:User {id: $headId})
       FOREACH (_ IN CASE WHEN h IS NOT NULL THEN [1] ELSE [] END | MERGE (d)-[:HEADED_BY]->(h))
       RETURN d`,
      {
        id,
        name: dto.name ?? null,
        description: dto.description ?? null,
        headId: dto.headId ?? null,
      },
    );
  }

  async delete(id: string) {
    const [row] = await this.neo4j.run(
      `MATCH (d:Department {id: $id})
       OPTIONAL MATCH (staff:User)-[:MEMBER_OF]->(d)
       RETURN count(staff) AS staffCount`,
      { id },
      'READ',
    );
    if (row && row.staffCount > 0) {
      throw new BadRequestException('Cannot delete a department with staff assigned');
    }
    await this.neo4j.run(`MATCH (d:Department {id: $id}) DETACH DELETE d`, { id });
  }
}
