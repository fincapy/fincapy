import { AuthRateLimiter } from '@/backend/adapters/rateLimiter';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { v4 as uuidv4 } from 'uuid';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

describe('AuthRateLimiter', () => {
  let rateLimiter;
  let redisAdapter;
  const testIp = '127.0.0.1';
  const testEmail = 'test@example.com';
  const testProcessId = 'login';

  beforeAll(async () => {
    redisAdapter = new RedisAdapter({ redisClient });
    rateLimiter = new AuthRateLimiter({ redisAdapter });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log');
  });

  afterEach(async () => {
    // Clean up Redis keys after each test
    const hashedIp = rateLimiter.hashIp(testIp);
    const hashedEmail = rateLimiter.hashEmail(testEmail);
    await redisAdapter.delete(
      `rate-limit:${testProcessId}:ip:${hashedIp}:attempts`
    );
    await redisAdapter.delete(
      `rate-limit:${testProcessId}:ip:${hashedIp}:lastAttempt`
    );
    await redisAdapter.delete(
      `rate-limit:${testProcessId}:user:${hashedEmail}:attempts`
    );
    await redisAdapter.delete(
      `rate-limit:${testProcessId}:user:${hashedEmail}:lastAttempt`
    );
  });

  describe('Hash Functions', () => {
    it('should correctly hash an IP address', () => {
      const hashedIp = rateLimiter.hashIp(testIp);
      expect(hashedIp).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash is 64 hex chars

      // Hashing should be deterministic
      const hashedIpAgain = rateLimiter.hashIp(testIp);
      expect(hashedIp).toBe(hashedIpAgain);
    });

    it('should correctly hash an email address', () => {
      const hashedEmail = rateLimiter.hashEmail(testEmail);
      expect(hashedEmail).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash is 64 hex chars

      // Hashing should be deterministic
      const hashedEmailAgain = rateLimiter.hashEmail(testEmail);
      expect(hashedEmail).toBe(hashedEmailAgain);
    });
  });

  describe('Rate Limiting Core Functions', () => {
    it('should increment attempts correctly', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // Initial state
      const initialAttempts = await rateLimiter.getAttempts(key);
      expect(initialAttempts).toBe(0);

      // After incrementing
      await rateLimiter.incrementAttempts(key);
      const attemptsAfterIncrement = await rateLimiter.getAttempts(key);
      expect(attemptsAfterIncrement).toBe(1);

      // After incrementing again
      await rateLimiter.incrementAttempts(key);
      const attemptsAfterSecondIncrement = await rateLimiter.getAttempts(key);
      expect(attemptsAfterSecondIncrement).toBe(2);
    });

    it('should reset attempts correctly', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // Set up some attempts
      await rateLimiter.incrementAttempts(key);
      await rateLimiter.incrementAttempts(key);
      const attemptsBeforeReset = await rateLimiter.getAttempts(key);
      expect(attemptsBeforeReset).toBe(2);

      // Reset and verify
      await rateLimiter.resetAttempts(key);
      const attemptsAfterReset = await rateLimiter.getAttempts(key);
      expect(attemptsAfterReset).toBe(0);
    });

    it('should track last attempt time correctly', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // Initial state
      const initialTime = await rateLimiter.getLastAttemptTime(key);
      expect(initialTime).toBe(0);

      // After incrementing
      const beforeIncrement = Math.floor(Date.now() / 1000);
      await rateLimiter.incrementAttempts(key);
      const afterIncrement = Math.floor(Date.now() / 1000);
      const lastAttemptTime = await rateLimiter.getLastAttemptTime(key);

      // Should be close to current time
      expect(lastAttemptTime).toBeGreaterThanOrEqual(beforeIncrement);
      expect(lastAttemptTime).toBeLessThanOrEqual(afterIncrement);
    });

    it('should calculate backoff time correctly', () => {
      // No backoff when attempts <= MAX_ATTEMPTS
      expect(rateLimiter.calculateBackoffTime(0)).toBe(0);
      expect(rateLimiter.calculateBackoffTime(rateLimiter.MAX_ATTEMPTS)).toBe(
        0
      );

      // Exponential backoff for attempts > MAX_ATTEMPTS
      expect(
        rateLimiter.calculateBackoffTime(rateLimiter.MAX_ATTEMPTS + 1)
      ).toBe(300); // 5 minutes (300 seconds)
      expect(
        rateLimiter.calculateBackoffTime(rateLimiter.MAX_ATTEMPTS + 2)
      ).toBe(600); // 10 minutes (600 seconds)
      expect(
        rateLimiter.calculateBackoffTime(rateLimiter.MAX_ATTEMPTS + 3)
      ).toBe(1200); // 20 minutes (1200 seconds)

      // Should never exceed MAX_BACKOFF
      const highAttempts = rateLimiter.MAX_ATTEMPTS + 20; // Very high number
      expect(rateLimiter.calculateBackoffTime(highAttempts)).toBe(
        rateLimiter.MAX_BACKOFF
      );
    });

    it('should calculate time remaining correctly', () => {
      const now = Math.floor(Date.now() / 1000);

      // When last attempt was just now
      expect(rateLimiter.calculateTimeRemaining(now, 300)).toBeCloseTo(300, 0); // 5 minutes

      // When some time has passed
      expect(rateLimiter.calculateTimeRemaining(now - 100, 300)).toBeCloseTo(
        200,
        0
      ); // 3+ minutes left

      // When backoff time has elapsed
      expect(
        rateLimiter.calculateTimeRemaining(now - 400, 300)
      ).toBeLessThanOrEqual(0);
    });
  });

  describe('checkRateLimit', () => {
    it('should not throw error when under rate limit', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // With no attempts, should pass
      await expect(rateLimiter.checkRateLimit(key)).resolves.not.toThrow();

      // With attempts below threshold, should still pass
      for (let i = 0; i < rateLimiter.MAX_ATTEMPTS; i++) {
        await rateLimiter.incrementAttempts(key);
      }
      await expect(rateLimiter.checkRateLimit(key)).resolves.not.toThrow();
    });

    it('should throw error when rate limit exceeded', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // Exceed the maximum attempts
      for (let i = 0; i <= rateLimiter.MAX_ATTEMPTS; i++) {
        await rateLimiter.incrementAttempts(key);
      }

      // Should throw error with time remaining message
      await expect(rateLimiter.checkRateLimit(key)).rejects.toThrow(
        /Too many attempts/
      );
      await expect(rateLimiter.checkRateLimit(key)).rejects.toThrow(
        /try again in/
      );
    });
  });

  describe('withRateLimit', () => {
    it('should allow function execution when not rate limited (IP only)', async () => {
      const mockAuthFn = vi.fn().mockReturnValue(true);

      const result = await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId },
        mockAuthFn
      );

      expect(mockAuthFn).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should allow function execution when not rate limited (IP and user)', async () => {
      const mockAuthFn = vi.fn().mockReturnValue(true);

      const result = await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId, userId: testEmail },
        mockAuthFn
      );

      expect(mockAuthFn).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('should handle function returning callback function', async () => {
      const mockCallback = vi.fn().mockReturnValue('callback result');
      const mockAuthFn = vi.fn().mockReturnValue(mockCallback);

      const result = await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId },
        mockAuthFn
      );

      expect(mockAuthFn).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(result).toBe('callback result');
    });

    it('should reset attempts on successful authentication', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // Set up some attempts
      await rateLimiter.incrementAttempts(key);
      await rateLimiter.incrementAttempts(key);
      const attemptsBeforeAuth = await rateLimiter.getAttempts(key);
      expect(attemptsBeforeAuth).toBe(2);

      // Successful auth should reset attempts
      await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId },
        () => true
      );

      const attemptsAfterAuth = await rateLimiter.getAttempts(key);
      expect(attemptsAfterAuth).toBe(0);
    });

    it('should increment attempts on failed authentication', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // Initial state
      const initialAttempts = await rateLimiter.getAttempts(key);
      expect(initialAttempts).toBe(0);

      // Failed auth should increment attempts
      await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId },
        () => false
      );

      const attemptsAfterFailedAuth = await rateLimiter.getAttempts(key);
      expect(attemptsAfterFailedAuth).toBe(1);
    });

    it('should increment attempts on authentication error', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;

      // Initial state
      const initialAttempts = await rateLimiter.getAttempts(key);
      expect(initialAttempts).toBe(0);

      // Auth function throwing error should increment attempts
      await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId },
        () => {
          throw new Error('Auth error');
        }
      );

      const attemptsAfterError = await rateLimiter.getAttempts(key);
      expect(attemptsAfterError).toBe(1);
    });

    it('should block authentication after too many failed attempts', async () => {
      const key = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;
      const mockAuthFn = vi.fn().mockReturnValue(false);

      // Exceed the rate limit
      for (let i = 0; i <= rateLimiter.MAX_ATTEMPTS; i++) {
        await rateLimiter.incrementAttempts(key);
      }

      // Try authentication when rate limited
      const result = await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId },
        mockAuthFn
      );

      expect(mockAuthFn).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('IP Rate limit exceeded');
    });

    it('should throw error if IP address is missing', async () => {
      const mockAuthFn = vi.fn();

      await expect(
        rateLimiter.withRateLimit({ processId: testProcessId }, mockAuthFn)
      ).rejects.toThrow('IP address is required for rate limiting');

      expect(mockAuthFn).not.toHaveBeenCalled();
    });

    it('should handle user-based rate limiting separately from IP-based', async () => {
      const ipKey = `rate-limit:${testProcessId}:ip:${rateLimiter.hashIp(testIp)}`;
      const userKey = `rate-limit:${testProcessId}:user:${rateLimiter.hashEmail(testEmail)}`;
      const mockAuthFn = vi.fn().mockReturnValue(true);

      // Exceed rate limit for user only
      for (let i = 0; i <= rateLimiter.MAX_ATTEMPTS; i++) {
        await rateLimiter.incrementAttempts(userKey);
      }

      // Authentication should fail due to user rate limit
      const result = await rateLimiter.withRateLimit(
        { ip: testIp, processId: testProcessId, userId: testEmail },
        mockAuthFn
      );

      expect(mockAuthFn).not.toHaveBeenCalled();
      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('User Rate limit exceeded');
    });
  });
});
