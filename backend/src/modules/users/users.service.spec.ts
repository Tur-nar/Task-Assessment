import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockNeo4j: { run: jest.Mock };

  beforeEach(async () => {
    mockNeo4j = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: Neo4jService, useValue: mockNeo4j },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('creates a user and returns sanitized profile without passwordHash', async () => {
      mockNeo4j.run
        .mockResolvedValueOnce([]) // findByEmail check
        .mockResolvedValueOnce([
          {
            u: {
              id: 'u-1',
              firstName: 'Tunde',
              lastName: 'Alabi',
              email: 'tunde@test.com',
              role: 'staff',
              passwordHash: 'secret_hash',
            },
          },
        ]);

      const result = await service.create({
        firstName: 'Tunde',
        lastName: 'Alabi',
        email: 'tunde@test.com',
        password: 'Password123!',
        role: 'staff',
      });

      expect(result.id).toBe('u-1');
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('throws ConflictException if email is already taken', async () => {
      mockNeo4j.run.mockResolvedValueOnce([{ u: { id: 'existing', email: 'taken@test.com' } }]);

      await expect(
        service.create({
          firstName: 'Tunde',
          lastName: 'Alabi',
          email: 'taken@test.com',
          password: 'Password123!',
          role: 'staff',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('deletes user when they have no active tasks', async () => {
      mockNeo4j.run
        .mockResolvedValueOnce([{ activeTasks: 0 }])
        .mockResolvedValueOnce([]); // delete

      const result = await service.delete('u-1');

      expect(result.message).toBe('User deleted');
      expect(mockNeo4j.run).toHaveBeenCalledTimes(2);
    });

    it('blocks deletion with BadRequestException if user has active tasks', async () => {
      mockNeo4j.run.mockResolvedValueOnce([{ activeTasks: 3 }]);

      await expect(service.delete('u-1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('listSupervisors', () => {
    it('returns supervisors with aggregated team members and department', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          u: { id: 'sup-1', firstName: 'Femi', role: 'supervisor' },
          d: { id: 'd-1', name: 'Engineering' },
          teamMembers: [{ id: 'staff-1', firstName: 'Tunde' }],
        },
      ]);

      const result = await service.listSupervisors();

      expect(result).toHaveLength(1);
      expect(result[0].u.firstName).toBe('Femi');
      expect(result[0].teamMembers).toHaveLength(1);
    });
  });
});
