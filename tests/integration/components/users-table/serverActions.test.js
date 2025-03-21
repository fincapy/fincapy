import {
  removeUser,
  changeUserRole,
  changeUserName,
} from '@/components/users-table/serverActions';
import { inviteUser } from '@/components/users-dashboard/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { Session } from '@/backend/domain/session';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

const sessionId = uuidv4();
const viewerSessionId = uuidv4();
const editorSessionId = uuidv4();
const tenantId = uuidv4();
const userId = uuidv4();
const testUserId = uuidv4();

vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(),
  };
});

const validCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign({ sessionId, type: 'session' }, process.env.JWT_SECRET, {
      expiresIn: '3h',
      algorithm: 'HS256',
    }),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const viewerCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { sessionId: viewerSessionId, type: 'session' },
      process.env.JWT_SECRET,
      { expiresIn: '3h', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const editorCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { sessionId: editorSessionId, type: 'session' },
      process.env.JWT_SECRET,
      { expiresIn: '3h', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const missingCookieResolution = {
  get: vi.fn(() => undefined),
  set: vi.fn(),
  delete: vi.fn(),
};

const invalidCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { sessionId: 'invalid-session', type: 'session' },
      process.env.JWT_SECRET,
      {
        expiresIn: '3h',
        algorithm: 'HS256',
      }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

describe('Users Table Server Actions', () => {
  beforeAll(async () => {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const session = new Session({
      sessionId,
      userId,
      userRole: 'owner',
      tenantId,
      createdAt: new Date(),
      lastRotated: new Date(),
    });
    await sessionRepository.set({
      session,
      ttl: 60 * 60 * 3, // 3 hours
    });
    const viewerSession = new Session({
      sessionId: viewerSessionId,
      userId,
      userRole: 'viewer',
      tenantId,
      createdAt: new Date(),
      lastRotated: new Date(),
    });
    await sessionRepository.set({
      session: viewerSession,
      ttl: 60 * 60 * 3, // 3 hours
    });
    const editorSession = new Session({
      sessionId: editorSessionId,
      userId,
      userRole: 'editor',
      tenantId,
      createdAt: new Date(),
      lastRotated: new Date(),
    });
    await sessionRepository.set({
      session: editorSession,
      ttl: 60 * 60 * 3, // 3 hours
    });
    const transactionManager = new TransactionManager({
      redisAdapter,
    });
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
    });
    await setupNewTenantService.execute({
      tenantId,
      userId,
      email: `${userId}@test.com`,
      password: 'password',
      name: 'Test User',
      whitelistBilling: true,
    });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('removeUser', () => {
    it('should successfully remove a user', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First invite a user
      await inviteUser({
        userId: testUserId,
        email: `${testUserId}@test.com`,
        role: 'editor',
        name: 'Test Editor',
      });

      // Then try to remove them
      const result = await removeUser({
        userId: testUserId,
      });

      expect(result.success).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const result = await removeUser({
        userId: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
      expect(console.log).toHaveBeenCalledWith(
        'Remove user failed: User does not have owner permissions'
      );
    });

    it('should return false when user role is editor', async () => {
      cookies.mockResolvedValue(editorCookieResolution);

      const result = await removeUser({
        userId: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
      expect(console.log).toHaveBeenCalledWith(
        'Remove user failed: User does not have owner permissions'
      );
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const result = await removeUser({
        userId: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Remove user failed: No valid session found'
      );
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const result = await removeUser({
        userId: testUserId,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Remove user failed: No valid session found'
      );
    });

    it('should return false with invalid user ID', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const result = await removeUser({
        userId: 'invalid-uuid',
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Role changed validation failed'
      );
    });
  });

  describe('changeUserRole', () => {
    it('should successfully change a user role', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First invite a user
      await inviteUser({
        userId: testUserId,
        email: `${testUserId}@test.com`,
        role: 'editor',
        name: 'Test Editor',
      });

      // Then change their role
      const result = await changeUserRole({
        userId: testUserId,
        role: 'viewer',
      });

      expect(result.success).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const result = await changeUserRole({
        userId: testUserId,
        role: 'viewer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
      expect(console.log).toHaveBeenCalledWith(
        'Change role failed: User does not have owner permissions'
      );
    });

    it('should return false when user role is editor', async () => {
      cookies.mockResolvedValue(editorCookieResolution);

      const result = await changeUserRole({
        userId: testUserId,
        role: 'viewer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
      expect(console.log).toHaveBeenCalledWith(
        'Change role failed: User does not have owner permissions'
      );
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const result = await changeUserRole({
        userId: testUserId,
        role: 'viewer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Change role failed: No valid session found'
      );
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const result = await changeUserRole({
        userId: testUserId,
        role: 'viewer',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Change role failed: No valid session found'
      );
    });

    it('should return false with invalid role', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const result = await changeUserRole({
        userId: testUserId,
        role: 'invalid-role',
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Role change validation failed');
    });
  });

  describe('changeUserName', () => {
    it('should successfully change a user name', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First invite a user
      await inviteUser({
        userId: testUserId,
        email: `${testUserId}@test.com`,
        role: 'editor',
        name: 'Test Editor',
      });

      // Then change their name
      const result = await changeUserName({
        userId: testUserId,
        name: 'Updated Name',
      });

      expect(result.success).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const result = await changeUserName({
        userId: testUserId,
        name: 'Updated Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
      expect(console.log).toHaveBeenCalledWith(
        'Change name failed: User does not have owner permissions'
      );
    });

    it('should return false when user role is editor', async () => {
      cookies.mockResolvedValue(editorCookieResolution);

      const result = await changeUserName({
        userId: testUserId,
        name: 'Updated Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient permissions');
      expect(console.log).toHaveBeenCalledWith(
        'Change name failed: User does not have owner permissions'
      );
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const result = await changeUserName({
        userId: testUserId,
        name: 'Updated Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Change name failed: No valid session found'
      );
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const result = await changeUserName({
        userId: testUserId,
        name: 'Updated Name',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Change name failed: No valid session found'
      );
    });

    it('should return false with empty name', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const result = await changeUserName({
        userId: testUserId,
        name: '',
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Name change validation failed');
    });
  });
});
