import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly neo4j: Neo4jService) { }

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
    const { passwordHash, ...safeUser } = row.u;
    return { ...safeUser, department: row.d ?? null, supervisor: row.s ?? null };
  }

  async list(filters: { role?: string; departmentId?: string; status?: string }) {
    return this.neo4j.run(
      `MATCH (u:User)
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       WHERE ($role IS NULL OR u.role = $role)
         AND ($departmentId IS NULL OR d.id = $departmentId)
         AND ($status IS NULL OR u.status = $status)
       RETURN u { .*, passwordHash: null } AS u, d
       ORDER BY u.lastName, u.firstName`,
      {
        role: filters.role ?? null,
        departmentId: filters.departmentId ?? null,
        status: filters.status ?? null,
      },
      'READ',
    );
  }

  async listSupervisors() {
    return this.neo4j.run(
      `MATCH (u:User {role: 'supervisor', status: 'active'})
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       OPTIONAL MATCH (member:User)-[:SUPERVISED_BY]->(u)
       WITH u, d, collect(member { .id, .firstName, .lastName, .email, .status }) AS teamMembers
       RETURN u { .*, passwordHash: null } AS u, d, teamMembers
       ORDER BY u.lastName`,
      {},
      'READ',
    );
  }

  async update(id: string, dto: UpdateUserDto) {
    const [row] = await this.neo4j.run(
      `MATCH (u:User {id: $id}) 
       RETURN u.role AS role
       `,
      { id },
      'READ',
    );

    if (row?.role === 'super_admin') {
      throw new BadRequestException('Cannot update a super admin');
    }

    await this.neo4j.run(
      `MATCH (u:User {id: $id})
       SET u.firstName = coalesce($firstName, u.firstName),
           u.lastName = coalesce($lastName, u.lastName),
           u.role = coalesce($role, u.role)`,
      {
        id,
        firstName: dto.firstName ?? null,
        lastName: dto.lastName ?? null,
        role: dto.role ?? null,
      },
    );

    if (dto.departmentId !== undefined) {
      await this.neo4j.run(
        `MATCH (u:User {id: $id})
         OPTIONAL MATCH (u)-[old:MEMBER_OF]->(:Department)
         DELETE old
         WITH u
         OPTIONAL MATCH (d:Department {id: $departmentId})
         FOREACH (_ IN CASE WHEN d IS NOT NULL THEN [1] ELSE [] END |
           MERGE (u)-[:MEMBER_OF]->(d)
         )`,
        { id, departmentId: dto.departmentId ?? null },
      );
    }

    if (dto.supervisorId !== undefined) {
      await this.neo4j.run(
        `MATCH (u:User {id: $id})
         OPTIONAL MATCH (u)-[old:SUPERVISED_BY]->(:User)
         DELETE old
         WITH u
         OPTIONAL MATCH (s:User {id: $supervisorId})
         FOREACH (_ IN CASE WHEN s IS NOT NULL THEN [1] ELSE [] END |
           MERGE (u)-[:SUPERVISED_BY]->(s)
         )`,
        { id, supervisorId: dto.supervisorId ?? null },
      );
    }

    return this.findById(id);
  }

  async delete(id: string) {
    const [row] = await this.neo4j.run(
      `MATCH (u:User {id: $id})
       OPTIONAL MATCH (t:Task)-[:ASSIGNED_TO]->(u)
       WHERE t.status IN ['not_started', 'in_progress', 'overdue']
       RETURN count(t) AS activeTasks, u.role as role`,
      { id },
      'READ',
    );
    if (row?.role === 'super_admin') {
      throw new BadRequestException('Cannot delete a super admin');
    }
    if (row.activeTasks > 0) {
      throw new BadRequestException('Cannot delete a user with active tasks. Reassign or complete their tasks first.');
    }
    await this.neo4j.run(`MATCH (u:User {id: $id}) DETACH DELETE u`, { id });
    return { message: 'User deleted' };
  }

  async reportingChain(userId: string) {
    return this.neo4j.run(
      `MATCH path = (u:User {id: $userId})-[:SUPERVISED_BY*1..10]->(manager:User)
       RETURN manager { .*, passwordHash: null } AS manager, length(path) AS depth
       ORDER BY depth`,
      { userId },
      'READ',
    );
  }

  async teamMembers(supervisorId: string) {
    return this.neo4j.run(
      `MATCH (member:User)-[:SUPERVISED_BY]->(:User {id: $supervisorId})
       RETURN member { .*, passwordHash: null } AS member`,
      { supervisorId },
      'READ',
    );
  }

  async setStatus(id: string, status: 'active' | 'inactive') {
    const [row] = await this.neo4j.run(
      `MATCH (u:User {id: $id}) 
       RETURN u.role AS role
       `,
      { id },
      'READ',
    );

    if (row?.role === 'super_admin') {
      throw new BadRequestException('Cannot change status of a super admin');
    }
    await this.neo4j.run(`MATCH (u:User {id: $id}) SET u.status = $status`, {
      id,
      status,
    });
    return { message: `User status set to ${status}` };
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
    return { message: 'Supervisor reassigned' };
  }
}
