import { authenticateForHighRiskAction } from '@/components/sign-in-reauth-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { Session } from '@/backend/domain/session';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

describe('Sign In Form Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    headers.mockReturnValue({ get: vi.fn(() => crypto.randomUUID()) });
    vi.spyOn(console, 'log');
    cookies.mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateEmailPassword', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const testPassword = 'testPassword123!';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager({
        redisAdapter,
      });
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        whitelistBilling: true,
      });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
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
      const validTotpCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);
      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: testPassword,
      });

      expect(validTotpCookieResolution.set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedHighRiskActionToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 5 * 1000, // 5 minutes
        }
      );

      expect(result).toBe(true);
    });

    it('should fail with incorrect password', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const testPassword = 'testPassword123!';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager({
        redisAdapter,
      });
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        whitelistBilling: true,
      });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
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
      const validTotpCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);
      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: 'wrongPassword',
      });

      expect(result).toBe(false);
      expect(validTotpCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Invalid email/password combination'
      );
    });

    it('should fail with non-existent email', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const testPassword = 'testPassword123!';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager({
        redisAdapter,
      });
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        whitelistBilling: true,
      });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
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
      const validTotpCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);
      const result = await authenticateForHighRiskAction({
        email: 'nonexistent@test.com',
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(validTotpCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email does not match authenticated user'
      );
    });

    it('should fail with invalid email format', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const testPassword = 'testPassword123!';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager({
        redisAdapter,
      });
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        whitelistBilling: true,
      });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
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
      const validTotpCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);
      const result = await authenticateForHighRiskAction({
        email: 'invalid-email',
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(validTotpCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email/password validation failed'
      );
    });

    it('should fail with empty password', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const testPassword = 'testPassword123!';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager({
        redisAdapter,
      });
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        whitelistBilling: true,
      });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
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
      const validTotpCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);
      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: '',
      });

      expect(result).toBe(false);
      expect(validTotpCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email/password validation failed'
      );
    });

    it('should respect rate limiting for IP address', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const testPassword = 'testPassword123!';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager({
        redisAdapter,
      });
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        whitelistBilling: true,
      });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
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
      const validTotpCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);
      headers.mockReturnValue({
        get: vi.fn().mockReturnValue(crypto.randomUUID()),
      });
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        const randomEmail = `${uuidv4()}@test.com`;
        await authenticateForHighRiskAction({
          email: randomEmail,
          password: 'wrongPassword',
        });
      }

      const result = await authenticateForHighRiskAction({
        email: `${uuidv4()}@test.com`,
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('IP Rate limit exceeded');
    });

    it('should respect rate limiting for email address', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const testPassword = 'testPassword123!';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager({
        redisAdapter,
      });
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        whitelistBilling: true,
      });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
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
      const validTotpCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);
      headers.mockReturnValue({
        get: vi.fn().mockReturnValueOnce(crypto.randomUUID()),
      });

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        await authenticateForHighRiskAction({
          email: 'rateLimitedEmail@test.com',
          password: 'wrongPassword',
        });
      }

      const result = await authenticateForHighRiskAction({
        email: 'rateLimitedEmail@test.com',
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('User Rate limit exceeded');
    });
  });
});
