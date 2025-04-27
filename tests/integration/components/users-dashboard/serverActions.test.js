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
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

const sessionId = uuidv4();
const viewerSessionId = uuidv4();
const editorSessionId = uuidv4();
const tenantId = uuidv4();
const userId = uuidv4();

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

describe('Users Dashboard Server Actions', () => {
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

  describe('inviteUser', () => {
    it('should successfully invite a user when owner makes request', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const userData = {
        userId: uuidv4(),
        email: 'test@example.com',
        role: 'editor',
        name: 'Test User',
      };

      const result = await inviteUser(userData);

      expect(result).toEqual({ success: true });
    });

    it('should fail when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const userData = {
        userId: uuidv4(),
        email: 'test@example.com',
        role: 'editor',
        name: 'Test User',
      };

      const result = await inviteUser(userData);

      expect(result).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
      expect(console.log).toHaveBeenCalledWith(
        'User invitation failed: User does not have owner role'
      );
    });

    it('should fail when user role is editor', async () => {
      cookies.mockResolvedValue(editorCookieResolution);

      const userData = {
        userId: uuidv4(),
        email: 'test@example.com',
        role: 'editor',
        name: 'Test User',
      };

      const result = await inviteUser(userData);

      expect(result).toEqual({
        success: false,
        error: 'Insufficient permissions',
      });
      expect(console.log).toHaveBeenCalledWith(
        'User invitation failed: User does not have owner role'
      );
    });

    it('should fail when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const userData = {
        userId: uuidv4(),
        email: 'test@example.com',
        role: 'editor',
        name: 'Test User',
      };

      const result = await inviteUser(userData);

      expect(redirect).toHaveBeenCalledWith('/signin');
      expect(console.log).toHaveBeenCalledWith(
        'User invitation failed: No valid session found'
      );
    });

    it('should fail when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const userData = {
        userId: uuidv4(),
        email: 'test@example.com',
        role: 'editor',
        name: 'Test User',
      };

      const result = await inviteUser(userData);

      expect(redirect).toHaveBeenCalledWith('/signin');
      expect(console.log).toHaveBeenCalledWith(
        'User invitation failed: No valid session found'
      );
    });

    it('should fail with invalid input data', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const invalidUserData = {
        userId: 'not-a-uuid',
        email: 'not-an-email',
        role: 'invalid-role',
        name: '',
      };

      const result = await inviteUser(invalidUserData);

      expect(result).toEqual({
        success: false,
        error: 'Invalid input data',
      });
      expect(console.log).toHaveBeenCalledWith(
        'User invitation failed: Invalid input data'
      );
    });

    it('should sanitize input data', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const userDataWithHtml = {
        userId: uuidv4(),
        email: 'test@example.com',
        role: 'editor',
        name: '<script>alert("xss")</script>Test User',
      };

      const result = await inviteUser(userDataWithHtml);

      expect(result).toEqual({ success: true });
    });
  });
});
