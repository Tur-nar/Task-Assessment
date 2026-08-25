import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Neo4jService } from '../../lib/neo4j/neo4j.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockNeo4j: { run: jest.Mock };
  let mockJwt: { sign: jest.Mock };
  let mockConfig: { get: jest.Mock };

  beforeEach(async () => {
    mockNeo4j = {
      run: jest.fn(),
    };
    mockJwt = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
    };
    mockConfig = {
      get: jest.fn((key: string) => {
        if (key === 'SUPER_ADMIN_EMAIL') return 'admin@test.com';
        if (key === 'SUPER_ADMIN_PASSWORD') return 'AdminPass123!';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: Neo4jService, useValue: mockNeo4j },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('returns a JWT token and sanitized user on valid credentials', async () => {
      const passwordHash = await bcrypt.hash('secret123', 10);
      mockNeo4j.run
        .mockResolvedValueOnce([
          {
            u: {
              id: 'user-1',
              email: 'user@test.com',
              role: 'staff',
              status: 'active',
              passwordHash,
            },
          },
        ])
        .mockResolvedValueOnce([]); // lastLogin update

      const result = await service.login('user@test.com', 'secret123');

      expect(result.token).toBe('mock_jwt_token');
      expect(result.user.id).toBe('user-1');
      expect((result.user as any).passwordHash).toBeUndefined();
      expect(mockJwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'user@test.com',
        role: 'staff',
      });
    });

    it('throws UnauthorizedException if user not found', async () => {
      mockNeo4j.run.mockResolvedValueOnce([]);

      await expect(service.login('ghost@test.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException if user is inactive', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          u: {
            id: 'user-1',
            email: 'user@test.com',
            status: 'inactive',
            passwordHash: 'hash',
          },
        },
      ]);

      await expect(service.login('user@test.com', 'pass')).rejects.toThrow(
        'Account is Inactive. Contact admin',
      );
    });

    it('throws UnauthorizedException on incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correctPassword', 10);
      mockNeo4j.run.mockResolvedValueOnce([
        {
          u: {
            id: 'user-1',
            email: 'user@test.com',
            status: 'active',
            passwordHash,
          },
        },
      ]);

      await expect(
        service.login('user@test.com', 'wrongPassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('me', () => {
    it('returns sanitized user with department and supervisor projections', async () => {
      mockNeo4j.run.mockResolvedValueOnce([
        {
          u: { id: 'u-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', passwordHash: 'hash' },
          d: { id: 'dept-1', name: 'Engineering' },
          s: { id: 'sup-1', firstName: 'Jane', lastName: 'Boss' },
        },
      ]);

      const result = await service.me('u-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('u-1');
      expect((result as any)?.passwordHash).toBeUndefined();
      expect(result?.department?.name).toBe('Engineering');
      expect(result?.supervisor?.firstName).toBe('Jane');
    });

    it('returns null if user does not exist', async () => {
      mockNeo4j.run.mockResolvedValueOnce([]);

      const result = await service.me('unknown');

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('updates passwordHash when current password matches', async () => {
      const oldHash = await bcrypt.hash('oldPass123', 10);
      mockNeo4j.run
        .mockResolvedValueOnce([{ u: { id: 'u-1', passwordHash: oldHash } }])
        .mockResolvedValueOnce([]);

      const result = await service.changePassword('u-1', 'oldPass123', 'newPass456');

      expect(result.message).toBe('Password changed successfully');
      expect(mockNeo4j.run).toHaveBeenCalledTimes(2);
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      const oldHash = await bcrypt.hash('oldPass123', 10);
      mockNeo4j.run.mockResolvedValueOnce([{ u: { id: 'u-1', passwordHash: oldHash } }]);

      await expect(
        service.changePassword('u-1', 'incorrectPass', 'newPass456'),
      ).rejects.toThrow('Current password is incorrect');
    });
  });
});
