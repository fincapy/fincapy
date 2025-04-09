import { authenticateForHighRiskAction } from '@/components/sign-in-reauth-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { AuthRateLimiter } from '@/backend/adapters/rateLimiter';
import { cookies, headers } from 'next/headers';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

const userId = uuidv4();
const tenantId = uuidv4();
const testEmail = `${userId}@test.com`;
const testPassword = 'testPassword123!';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

describe('Sign In Reauth Form Server Actions', () => {
  beforeAll(async () => {
    // Set up a test user
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
  });

  beforeEach(() => {
    vi.resetAllMocks();
    const ip = crypto.randomUUID();
    headers.mockReturnValue({ get: vi.fn(() => ip) });
    cookies.mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
    });
    vi.spyOn(console, 'log');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticateForHighRiskAction', () => {
    it('should successfully authenticate with valid credentials and active session', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: testPassword,
      });

      expect(result).toBe(true);
      expect(cookies().set).toHaveBeenCalledWith(
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

      // Verify the token structure
      const token = cookies().set.mock.calls[0][1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        userId,
        tenantId,
        type: 'emailPasswordAuthenticatedHighRiskAction',
      });
    });

    it('should fail with no active session', async () => {
      // Mock no active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock touchSession to return false (no valid session)
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(false);

      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
    });

    it('should fail with validation errors on email or password', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      // Test with invalid email
      const resultInvalidEmail = await authenticateForHighRiskAction({
        email: 'not-an-email',
        password: testPassword,
      });

      expect(resultInvalidEmail).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Email/password validation failed'
      );
      expect(cookies().set).not.toHaveBeenCalled();

      // Reset mocks
      vi.clearAllMocks();
      vi.spyOn(console, 'log');
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      // Test with short password
      const resultShortPassword = await authenticateForHighRiskAction({
        email: testEmail,
        password: 'short', // Less than 8 characters
      });

      expect(resultShortPassword).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Email/password validation failed'
      );
      expect(cookies().set).not.toHaveBeenCalled();
    });

    it('should fail with incorrect password', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: 'wrongPassword123!',
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Invalid email/password combination'
      );
    });

    it('should fail with email that does not match session user', async () => {
      // Mock an active session with different userId
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value with different userId
      const mockSession = {
        userId: uuidv4(), // Different userId than the test user
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email does not match authenticated user'
      );
    });

    it('should handle case with nonexistent user', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      // Mock userRepository.getByEmail to return null
      const userRepository = new UserRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      vi.spyOn(userRepository, 'getByEmail').mockResolvedValue(null);

      const result = await authenticateForHighRiskAction({
        email: 'nonexistent@example.com',
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email does not match authenticated user'
      );
    });

    it('should respect rate limiting', async () => {
      // Mock rate limiter to simulate exceeded limit
      const mockRateLimiter = new AuthRateLimiter({
        redisAdapter: new RedisAdapter({ redisClient }),
      });

      vi.spyOn(mockRateLimiter, 'withRateLimit').mockImplementation(
        async (params, callback) => {
          // Simulate rate limit exceeded
          return false;
        }
      );

      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      const result = await authenticateForHighRiskAction({
        email: testEmail,
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
    });
  });
});
