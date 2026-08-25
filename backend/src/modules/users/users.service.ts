import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly neo4j: Neo4jService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const id = uuid();
    const [row] = await this.neo4j.run(
      `CREATE (u:User {
        id: $id, firstName: $firstName, lastName: $lastName, email: $email,
        passwordHash: $passwordHash, role: $role, status: 'active', createdAt: datetime()
      })
      WITH u
      OPTIONAL MATCH (d:Department {id: $departmentId})
      FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END |
        MERGE (u)-[:MEMBER_OF]->(d)
      )
      WITH u
      OPTIONAL MATCH (s:User {id: $supervisorId})
      FOREACH (_ IN CASE WHEN s IS NOT NULL THEN [1] ELSE [] END |
        MERGE (u)-[:SUPERVISED_BY]->(s)
      )
      RETURN u`,
      {
        id,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash,
        role: dto.role,
        departmentId: dto.departmentId ?? null,
        supervisorId: dto.supervisorId ?? null,
      },
    );

    const user = row.u;
    const { passwordHash: _omit, ...safe } = user;
    return safe;
  }

  async findByEmail(email: string) {
    const [row] = await this.neo4j.run(
      `MATCH (u:User {email: $email}) RETURN u`,
      { email },
      'READ',
    );
    return row?.u ?? null;
  }

  async findById(id: string) {
    const [row] = await this.neo4j.run(
      `MATCH (u:User {id: $id})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (u)-[:SUPERVISED_BY]->(s:User)
       RETURN u, d, s`,
      { id },
      'READ',
    );
    if (!row) return null;
    return { ...row.u, department: row.d ?? null, supervisor: row.s ?? null };
  }

  async list(filters: { role?: string; departmentId?: string; status?: string }) {
    return this.neo4j.run(
      `MATCH (u:User)
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       WHERE ($role IS NULL OR u.role = $role)
         AND ($departmentId IS NULL OR d.id = $departmentId)
         AND ($status IS NULL OR u.status = $status)
       RETURN u, d
       ORDER BY u.lastName, u.firstName`,
      {
        role: filters.role ?? null,
        departmentId: filters.departmentId ?? null,
        status: filters.status ?? null,
      },
      'READ',
    );
  }

  async reportingChain(userId: string) {
    return this.neo4j.run(
      `MATCH path = (u:User {id: $userId})-[:SUPERVISED_BY*1..10]->(manager:User)
       RETURN manager, length(path) AS depth
       ORDER BY depth`,
      { userId },
      'READ',
    );
  }

  async teamMembers(supervisorId: string) {
    return this.neo4j.run(
      `MATCH (member:User)-[:SUPERVISED_BY]->(:User {id: $supervisorId})
       RETURN member`,
      { supervisorId },
      'READ',
    );
  }

  async setStatus(id: string, status: 'active' | 'inactive') {
    await this.neo4j.run(`MATCH (u:User {id: $id}) SET u.status = $status`, {
      id,
      status,
    });
  }

  async reassignSupervisor(memberIds: string[], newSupervisorId: string) {
    await this.neo4j.run(
      `MATCH (u:User) WHERE u.id IN $memberIds
       OPTIONAL MATCH (u)-[old:SUPERVISED_BY]->(:User)
       DELETE old
       WITH u
       MATCH (s:User {id: $newSupervisorId})
       MERGE (u)-[:SUPERVISED_BY]->(s)`,
      { memberIds, newSupervisorId },
    );
  }
}
