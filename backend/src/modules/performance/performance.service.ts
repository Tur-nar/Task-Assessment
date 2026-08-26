import { Injectable } from '@nestjs/common';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';

interface PerformanceRecord {
  user: Record<string, any>;
  department: Record<string, any> | null;
  totalTasksAssigned: number;
  tasksCompleted: number;
  tasksOnTime: number;
  tasksCompletedLate: number;
  tasksLate: number;
  performanceScore: number;
  rating: string;
}

@Injectable()
export class PerformanceService {
  constructor(private readonly neo4j: Neo4jService) {}

  private computeScore(counts: {
    total: number;
    onTime: number;
    completedLate: number;
    overdue: number;
    completed: number;
  }): { score: number; rating: string } {
    const { total, onTime, completedLate, overdue, completed } = counts;
    if (total === 0) return { score: 50, rating: 'Average' };

    const base = 50;
    const onTimeBonus = (onTime / total) * 50;
    const overduePenalty = (overdue / total) * 40;
    const completionBonus = (completed / total) * 10;
    const lateBonus = (completedLate / total) * 10;

    const raw = base + onTimeBonus - overduePenalty + completionBonus + lateBonus;
    const score = Math.round(Math.max(0, Math.min(100, raw)));

    let rating: string;
    if (score >= 90) rating = 'Excellent';
    else if (score >= 75) rating = 'Good';
    else if (score >= 50) rating = 'Average';
    else rating = 'Needs Improvement';

    return { score, rating };
  }

  private async fetchRawCounts(whereClause: string, params: Record<string, any>) {
    const rows = await this.neo4j.run(
      `MATCH (u:User)
       WHERE u.role IN ['staff', 'supervisor'] ${whereClause}
       OPTIONAL MATCH (t:Task)-[:ASSIGNED_TO]->(u)
       WITH u,
         count(t) AS total,
         count(CASE WHEN t.status = 'completed' THEN 1 END) AS onTime,
         count(CASE WHEN t.status = 'completed_late' THEN 1 END) AS completedLate,
         count(CASE WHEN t.status = 'overdue' THEN 1 END) AS overdue,
         count(CASE WHEN t.status IN ['completed', 'completed_late'] THEN 1 END) AS completed
       OPTIONAL MATCH (u)-[:MEMBER_OF]->(d:Department)
       RETURN u { .*, passwordHash: null } AS user, d, total, onTime, completedLate, overdue, completed
       ORDER BY total DESC`,
      params,
      'READ',
    );

    return rows.map((row: any) => {
      const { score, rating } = this.computeScore({
        total: row.total,
        onTime: row.onTime,
        completedLate: row.completedLate,
        overdue: row.overdue,
        completed: row.completed,
      });
      return {
        user: row.user,
        department: row.d ?? null,
        totalTasksAssigned: row.total,
        tasksCompleted: row.completed,
        tasksOnTime: row.onTime,
        tasksCompletedLate: row.completedLate,
        tasksLate: row.overdue,
        performanceScore: score,
        rating,
      } as PerformanceRecord;
    });
  }

  async getAll(caller?: { id: string; role: string }) {
    if (caller?.role === 'supervisor' && caller?.id) {
      return this.fetchRawCounts(
        `AND (u.id = $callerId OR EXISTS { MATCH (u)-[:SUPERVISED_BY]->(:User {id: $callerId}) })`,
        { callerId: caller.id },
      );
    }
    return this.fetchRawCounts('', {});
  }

  async getByUser(userId: string) {
    const results = await this.fetchRawCounts('AND u.id = $userId', { userId });
    return results[0] ?? null;
  }

  async getByDepartment(departmentId: string, caller?: { id: string; role: string }) {
    if (caller?.role === 'supervisor' && caller?.id) {
      return this.fetchRawCounts(
        `AND (u.id = $callerId OR EXISTS { MATCH (u)-[:SUPERVISED_BY]->(:User {id: $callerId}) })
         AND EXISTS { MATCH (u)-[:MEMBER_OF]->(:Department {id: $departmentId}) }`,
        { callerId: caller.id, departmentId },
      );
    }
    return this.fetchRawCounts(
      `AND EXISTS { MATCH (u)-[:MEMBER_OF]->(:Department {id: $departmentId}) }`,
      { departmentId },
    );
  }
}
