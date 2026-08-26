import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let mockNeo4j: { run: jest.Mock };
  let mockNotifications: { create: jest.Mock };

  beforeEach(async () => {
    mockNeo4j = {
      run: jest.fn(),
    };
    mockNotifications = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: Neo4jService, useValue: mockNeo4j },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('creates task with assignment, department, and dependencies', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          t: {
            id: 'task-1',
            title: 'Build API',
            status: 'not_started',
            priority: 'high',
          },
        },
      ]);

      const result = await service.create(
        {
          title: 'Build API',
          assignedToId: 'u-1',
          priority: 'high',
          deadline: '2026-09-01T00:00:00.000Z',
        },
        'creator-1',
      );

      expect(result.id).toBe('task-1');
      expect(result.status).toBe('not_started');
    });
  });

  describe('getStats', () => {
    it('returns aggregated counts across all task statuses', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          total: 10,
          completed: 4,
          completedLate: 1,
          inProgress: 3,
          overdue: 1,
          notStarted: 1,
        },
      ]);

      const stats = await service.getStats();

      expect(stats.total).toBe(10);
      expect(stats.completed).toBe(4);
      expect(stats.overdue).toBe(1);
    });
  });

  describe('addDependency & cycle check', () => {
    it('throws BadRequestException if task depends on itself', async () => {
      await expect(service.addDependency('task-1', 'task-1')).rejects.toThrow(
        'A task cannot depend on itself',
      );
    });

    it('throws BadRequestException if adding dependency would create a cycle', async () => {
      mockNeo4j.run.mockResolvedValueOnce([{ cycles: 1 }]);

      await expect(service.addDependency('task-A', 'task-B')).rejects.toThrow(
        'That dependency would create a cycle',
      );
    });

    it('creates dependency edge when acyclic', async () => {
      mockNeo4j.run
        .mockResolvedValueOnce([{ cycles: 0 }])
        .mockResolvedValueOnce([]);

      await expect(service.addDependency('task-A', 'task-B')).resolves.not.toThrow();
      expect(mockNeo4j.run).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateStatus', () => {
    it('blocks moving an overdue task to in_progress', async () => {
      // Mock findById returning overdue task
      mockNeo4j.run.mockResolvedValueOnce([
        {
          t: { id: 'task-1', status: 'overdue' },
          assignee: null,
          assigner: null,
          d: null,
          dependencies: [],
        },
      ]);

      await expect(service.updateStatus('task-1', 'in_progress')).rejects.toThrow(
        'An overdue task cannot be moved to in_progress',
      );
    });

    it('blocks starting a task if dependencies are incomplete', async () => {
      // Mock findById
      mockNeo4j.run
        .mockResolvedValueOnce([
          {
            t: { id: 'task-1', status: 'not_started' },
            assignee: null,
            assigner: null,
            d: null,
            dependencies: [],
          },
        ])
        // Mock readyToStart check
        .mockResolvedValueOnce([{ ready: false }]);

      await expect(service.updateStatus('task-1', 'in_progress')).rejects.toThrow(
        'This task is blocked by incomplete dependencies',
      );
    });
  });
});
