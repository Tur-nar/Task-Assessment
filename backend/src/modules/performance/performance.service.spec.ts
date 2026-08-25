import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { PerformanceService } from './performance.service';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let mockNeo4j: { run: jest.Mock };

  beforeEach(async () => {
    mockNeo4j = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: Neo4jService, useValue: mockNeo4j },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  describe('getAll & scoring algorithm', () => {
    it('computes 100% score (Excellent) for all on-time completed tasks', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          user: { id: 'u-1', firstName: 'Ada' },
          d: { id: 'd-1', name: 'Engineering' },
          total: 10,
          onTime: 10,
          completedLate: 0,
          overdue: 0,
          completed: 10,
        },
      ]);

      const records = await service.getAll();

      expect(records).toHaveLength(1);
      // base(50) + on_time(50) - overdue(0) + completion(10) = 110 clamped to 100
      expect(records[0].performanceScore).toBe(100);
      expect(records[0].rating).toBe('Excellent');
    });

    it('penalizes overdue tasks and gives partial credit for completed_late', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          user: { id: 'u-2', firstName: 'John' },
          d: null,
          total: 10,
          onTime: 2,           // +10
          completedLate: 2,    // +2 (late bonus) & +2 (completion bonus) -> +4
          overdue: 4,          // -16
          completed: 4,
        },
      ]);

      const records = await service.getAll();

      expect(records).toHaveLength(1);
      // base=50, onTime=(2/10)*50=10, overdue=(4/10)*40=16, comp=(4/10)*10=4, late=(2/10)*10=2
      // raw = 50 + 10 - 16 + 4 + 2 = 50
      expect(records[0].performanceScore).toBe(50);
      expect(records[0].rating).toBe('Average');
    });

    it('returns default 50 score (Average) when user has 0 assigned tasks', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          user: { id: 'u-3', firstName: 'Newbie' },
          d: null,
          total: 0,
          onTime: 0,
          completedLate: 0,
          overdue: 0,
          completed: 0,
        },
      ]);

      const records = await service.getAll();

      expect(records[0].performanceScore).toBe(50);
      expect(records[0].rating).toBe('Average');
    });
  });
});
