import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { DepartmentsService } from './departments.service';

describe('DepartmentsService', () => {
  let service: DepartmentsService;
  let mockNeo4j: { run: jest.Mock };

  beforeEach(async () => {
    mockNeo4j = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepartmentsService,
        { provide: Neo4jService, useValue: mockNeo4j },
      ],
    }).compile();

    service = module.get<DepartmentsService>(DepartmentsService);
  });

  describe('list', () => {
    it('returns departments with staff count and task completion rate', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          d: { id: 'd-1', name: 'Engineering' },
          head: { id: 'h-1', firstName: 'Femi' },
          staffCount: 5,
          activeTasks: 3,
          completionRate: 75.5,
        },
      ]);

      const result = await service.list();

      expect(result).toHaveLength(1);
      expect(result[0].d.name).toBe('Engineering');
      expect(result[0].staffCount).toBe(5);
      expect(result[0].completionRate).toBe(75.5);
    });
  });

  describe('delete', () => {
    it('deletes department when no staff are assigned', async () => {
      mockNeo4j.run
        .mockResolvedValueOnce([{ staffCount: 0 }])
        .mockResolvedValueOnce([]);

      await expect(service.delete('d-1')).resolves.not.toThrow();
      expect(mockNeo4j.run).toHaveBeenCalledTimes(2);
    });

    it('blocks deletion with BadRequestException when staff belong to department', async () => {
      mockNeo4j.run.mockResolvedValueOnce([{ staffCount: 4 }]);

      await expect(service.delete('d-1')).rejects.toThrow(BadRequestException);
    });
  });
});
