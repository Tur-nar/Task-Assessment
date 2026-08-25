import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { TargetsService } from './targets.service';

describe('TargetsService', () => {
  let service: TargetsService;
  let mockNeo4j: { run: jest.Mock };

  beforeEach(async () => {
    mockNeo4j = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TargetsService,
        { provide: Neo4jService, useValue: mockNeo4j },
      ],
    }).compile();

    service = module.get<TargetsService>(TargetsService);
  });

  describe('create', () => {
    it('creates team target connected to department and creator', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          t: {
            id: 'target-1',
            title: 'Q3 Sales',
            type: 'team',
            targetValue: 100,
          },
        },
      ]);

      const result = await service.create(
        {
          title: 'Q3 Sales',
          type: 'team',
          targetValue: 100,
          deadline: '2026-10-01T00:00:00.000Z',
          departmentId: 'dept-1',
        },
        'creator-1',
      );

      expect(result.id).toBe('target-1');
      expect(result.targetValue).toBe(100);
    });
  });

  describe('list and status computation', () => {
    it('computes "completed" status when currentValue >= targetValue', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          t: { id: 't-1', title: 'Target A', targetValue: 50, deadline: '2026-12-31T00:00:00.000Z' },
          currentValue: 55,
          assignee: null,
          d: null,
          creator: null,
        },
      ]);

      const targets = await service.list({});

      expect(targets[0].status).toBe('completed');
      expect(targets[0].currentValue).toBe(55);
    });

    it('computes "missed" status when deadline has passed and goal not met', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          t: { id: 't-2', title: 'Past Target', targetValue: 100, deadline: '2020-01-01T00:00:00.000Z' },
          currentValue: 20,
          assignee: null,
          d: null,
          creator: null,
        },
      ]);

      const targets = await service.list({});

      expect(targets[0].status).toBe('missed');
    });
  });

  describe('entries', () => {
    it('adds entry for target and returns entry details', async () => {
      mockNeo4j.run.mockResolvedValueOnce([]);

      const entry = await service.addEntry('t-1', 'u-1', 15, 'Sprint milestone');

      expect(entry.value).toBe(15);
      expect(entry.note).toBe('Sprint milestone');
      expect(mockNeo4j.run).toHaveBeenCalledTimes(1);
    });
  });
});
