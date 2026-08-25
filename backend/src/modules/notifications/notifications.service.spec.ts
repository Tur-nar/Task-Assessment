import { Test, TestingModule } from '@nestjs/testing';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNeo4j: { run: jest.Mock };

  beforeEach(async () => {
    mockNeo4j = {
      run: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: Neo4jService, useValue: mockNeo4j },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('creates in-app notification linked to user and optional task', async () => {
      mockNeo4j.run.mockResolvedValueOnce([]);

      const result = await service.create(
        'user-1',
        'New Task',
        'You were assigned task 1',
        'task_assigned',
        'info',
        'task-1',
      );

      expect(result.id).toBeDefined();
      expect(mockNeo4j.run).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUnreadCount', () => {
    it('returns count of unread notifications for user', async () => {
      mockNeo4j.run.mockResolvedValueOnce([{ count: 4 }]);

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(4);
    });
  });

  describe('markRead & markAllRead', () => {
    it('marks single notification as read', async () => {
      mockNeo4j.run.mockResolvedValueOnce([]);

      const result = await service.markRead('notif-1');

      expect(result.message).toBe('Notification marked as read');
    });

    it('marks all user notifications as read', async () => {
      mockNeo4j.run.mockResolvedValueOnce([]);

      const result = await service.markAllRead('user-1');

      expect(result.message).toBe('All notifications marked as read');
    });
  });
});
