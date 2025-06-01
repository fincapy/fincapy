import {
  authenticateEmailPassword,
  sendPasswordResetEmail,
} from '@/components/sign-in-form/serverActions';
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

const userId = uuidv4();
const tenantId = uuidv4();
const testEmail = `${userId}@test.com`;
const testPassword = 'testPassword123!';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Sign In Form Server Actions', () => {
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

  afterEach(async () => {
    // Clean up rate limiter Redis keys to prevent state from carrying over between tests
    const redisAdapter = new RedisAdapter({ redisClient });

    // Clear all keys for the authenticateEmailPassword and sendPasswordResetEmail processes
    const patterns = [
      'rate-limit:authenticateEmailPassword:*',
      'rate-limit:sendPasswordResetEmail:*',
    ];
    try {
      for (const pattern of patterns) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('authenticateEmailPassword', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const result = await authenticateEmailPassword({
        email: testEmail,
        password: testPassword,
      });

      expect(cookies().set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 10, // 10 minutes
        }
      );

      // Verify the token structure
      const token = cookies().set.mock.calls[0][1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        userId,
        tenantId,
        type: 'emailPasswordAuthenticated',
      });

      expect(redirect).toHaveBeenCalledWith('/verify-email');
    });

    it('should fail with incorrect password', async () => {
      const result = await authenticateEmailPassword({
        email: testEmail,
        password: 'wrongPassword',
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Invalid email/password combination'
      );
    });

    it('should fail with non-existent email', async () => {
      const result = await authenticateEmailPassword({
        email: 'nonexistent@test.com',
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Invalid email/password combination'
      );
    });

    it('should fail with invalid email format', async () => {
      const result = await authenticateEmailPassword({
        email: 'invalid-email',
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email/password validation failed'
      );
    });

    it('should fail with empty password', async () => {
      const result = await authenticateEmailPassword({
        email: testEmail,
        password: '',
      });

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'Email/password validation failed'
      );
    });

    it('should respect rate limiting for IP address', async () => {
      headers.mockReturnValue({
        get: vi.fn().mockReturnValue(crypto.randomUUID()),
      });
      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        const randomEmail = `${uuidv4()}@test.com`;
        await authenticateEmailPassword({
          email: randomEmail,
          password: 'wrongPassword',
        });
      }

      const result = await authenticateEmailPassword({
        email: `${uuidv4()}@test.com`,
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('IP Rate limit exceeded');
    });

    it('should respect rate limiting for email address', async () => {
      headers.mockReturnValue({
        get: vi.fn().mockReturnValueOnce(crypto.randomUUID()),
      });

      // Make multiple rapid requests
      for (let i = 0; i < 10; i++) {
        await authenticateEmailPassword({
          email: 'rateLimitedEmail@test.com',
          password: 'wrongPassword',
        });
      }

      const result = await authenticateEmailPassword({
        email: 'rateLimitedEmail@test.com',
        password: testPassword,
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('User Rate limit exceeded');
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should successfully send reset email for existing user', async () => {
      const result = await sendPasswordResetEmail({
        email: testEmail,
      });

      expect(result).toBe(true);
    });

    it('should return true even for non-existent email (security through obscurity)', async () => {
      const result = await sendPasswordResetEmail({
        email: 'nonexistent@test.com',
      });

      expect(result).toBe(true);
    });

    it('should fail with invalid email format', async () => {
      const result = await sendPasswordResetEmail({
        email: 'invalid-email',
      });

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Invalid email format for password reset'
      );
    });
  });
});
