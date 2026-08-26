import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  let service: CommentsService;
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
        CommentsService,
        { provide: Neo4jService, useValue: mockNeo4j },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('create', () => {
    it('creates a top-level task comment', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          c: { id: 'c-1', content: 'Great progress' },
          author: { id: 'u-1', firstName: 'Ada' },
        },
      ]);

      const result = await service.create('t-1', 'u-1', 'Great progress');

      expect(result.c.content).toBe('Great progress');
      expect(result.author.firstName).toBe('Ada');
    });

    it('throws BadRequestException if parent comment is not found on the task', async () => {
      mockNeo4j.run.mockResolvedValueOnce([]); // parent lookup fails

      await expect(
        service.create('t-1', 'u-1', 'Reply', 'non-existent-parent'),
      ).rejects.toThrow('Parent comment not found on this task');
    });
  });

  describe('delete', () => {
    it('allows comment author to delete their own comment', async () => {
      mockNeo4j.run
        .mockResolvedValueOnce([{ authorId: 'u-1' }])
        .mockResolvedValueOnce([]);

      const result = await service.delete('c-1', 'u-1', 'staff');

      expect(result.message).toBe('Comment deleted');
    });

    it('allows super_admin to delete any comment', async () => {
      mockNeo4j.run
        .mockResolvedValueOnce([{ authorId: 'u-author' }])
        .mockResolvedValueOnce([]);

      const result = await service.delete('c-1', 'admin-id', 'super_admin');

      expect(result.message).toBe('Comment deleted');
    });

    it('forbids another user from deleting someone else comment', async () => {
      mockNeo4j.run.mockResolvedValueOnce([{ authorId: 'u-author' }]);

      await expect(service.delete('c-1', 'other-user', 'staff')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
