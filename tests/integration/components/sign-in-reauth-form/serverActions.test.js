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
import { UserRepository } from '@/backend/adapters/repositories/userRepository';

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

  afterEach(async () => {
    // Clean up rate limiter Redis keys to prevent state from carrying over between tests
    const redisAdapter = new RedisAdapter({ redisClient });

    // Clear all keys for the authenticateForHighRiskAction process
    const pattern = 'rate-limit:authenticateForHighRiskAction:*';
    try {
      // Get all matching keys
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('authenticateEmailPassword', () => {
    it('should successfully authenticate with valid credentials when 2FA is disabled', async () => {
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

      // Verify 2FA is disabled by default
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      expect(user.totpEnabled).toBe(false);

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

      // When 2FA is disabled, should create highRiskActionValidatedToken directly
      expect(validTotpCookieResolution.set).toHaveBeenCalledWith(
        'highRiskActionValidatedToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 5, // 5 minutes
        }
      );

      // Verify the token structure
      const highRiskActionToken =
        validTotpCookieResolution.set.mock.calls[0][1];
      const decoded = jwt.verify(highRiskActionToken, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        userId,
        tenantId,
        type: 'highRiskActionValidated',
      });
      expect(decoded.jti).toBeDefined();

      expect(result).toBe(true);
    });

    it('should successfully authenticate with valid credentials when 2FA is enabled', async () => {
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

      // Enable 2FA for the user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.totpEnabled = true;
      user.totpSecret = 'test-secret';
      await userRepository.set({ userId, user });

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

      // When 2FA is enabled, should create intermediate token for TOTP verification
      expect(validTotpCookieResolution.set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedHighRiskActionToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 5, // 5 minutes
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

    it('should fail when user email does not match session user', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const differentUserId = uuidv4();
      const differentTenantId = uuidv4(); // Use different tenant ID
      const testEmail = `${userId}@test.com`;
      const differentEmail = `${differentUserId}@test.com`;
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
      await setupNewTenantService.execute({
        tenantId: differentTenantId, // Use different tenant ID
        userId: differentUserId,
        email: differentEmail,
        password: testPassword,
        name: 'Different User',
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
        email: differentEmail, // Different email than session user
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(validTotpCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email does not match authenticated user'
      );
    });

    it('should work for Google users with authProvider google', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
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
        password: 'dummy-password',
        name: 'Test User',
        whitelistBilling: true,
        authProvider: 'google',
      });

      // Verify user is marked as Google user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      expect(user.authProvider).toBe('google');

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

      const validCookieResolution = {
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
      cookies.mockResolvedValue(validCookieResolution);

      // For Google users, password authentication should not work
      // They should use Google OAuth for high risk actions
      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: 'any-password',
      });

      // This should fail because Google users should use OAuth flow
      expect(result).toBe(false);
      expect(validCookieResolution.set).not.toHaveBeenCalled();
    });
  });
});
