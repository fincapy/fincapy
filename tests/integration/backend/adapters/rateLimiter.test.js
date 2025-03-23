const { v4: uuidv4 } = require('uuid');
const RedisAdapter = require('../../../../src/backend/adapters/redis');
const RateLimiter = require('../../../../src/backend/adapters/rateLimiter');
const redisClient = require('../../../../src/backend/config/redis');

describe('RateLimiter Integration Tests', () => {
  let rateLimiter;
  let redisAdapter;
  let consoleLogSpy;
  const testIp = '127.0.0.1';
  const testUserId = uuidv4();

  beforeAll(async () => {
    redisAdapter = new RedisAdapter({ redisClient });
    rateLimiter = new RateLimiter(redisAdapter);
  });

  beforeEach(() => {
    vi.resetAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log');
  });

  afterEach(async () => {
    // Clean up rate limit keys after each test
    await redisAdapter.del(
      `rate-limit:ip:${rateLimiter.hashIp(testIp)}:attempts`
    );
    await redisAdapter.del(
      `rate-limit:ip:${rateLimiter.hashIp(testIp)}:lastAttempt`
    );
    await redisAdapter.del(`rate-limit:user:${testUserId}:attempts`);
    await redisAdapter.del(`rate-limit:user:${testUserId}:lastAttempt`);
    consoleLogSpy.mockRestore();
  });

  describe('withRateLimit', () => {
    it('should allow requests within rate limit', async () => {
      const mockAuthFn = vi.fn().mockResolvedValue(true);

      const result = await rateLimiter.withRateLimit(
        { ip: testIp },
        mockAuthFn
      );

      expect(result).toBe(true);
      expect(mockAuthFn).toHaveBeenCalledTimes(1);
    });

    it('should allow requests with userId within rate limit', async () => {
      const mockAuthFn = vi.fn().mockResolvedValue(true);

      const result = await rateLimiter.withRateLimit(
        { ip: testIp, userId: testUserId },
        mockAuthFn
      );

      expect(result).toBe(true);
      expect(mockAuthFn).toHaveBeenCalledTimes(1);
    });

    it('should reset attempts on successful authentication', async () => {
      const mockAuthFn = vi.fn().mockResolvedValue(true);

      // Make a few failed attempts first
      for (let i = 0; i < 3; i++) {
        try {
          await rateLimiter.withRateLimit({ ip: testIp }, () =>
            Promise.reject(new Error('Auth failed'))
          );
        } catch (error) {
          // Expected error
        }
      }

      // Now make a successful attempt
      await rateLimiter.withRateLimit({ ip: testIp }, mockAuthFn);

      const attempts = await rateLimiter.getAttempts(
        `rate-limit:ip:${rateLimiter.hashIp(testIp)}`
      );
      expect(attempts).toBe(0);
    });

    it('should throw error when IP is not provided', async () => {
      const mockAuthFn = vi.fn().mockResolvedValue(true);

      await expect(
        rateLimiter.withRateLimit({ ip: null }, mockAuthFn)
      ).rejects.toThrow('IP address is required for rate limiting');
      expect(mockAuthFn).not.toHaveBeenCalled();
    });

    it('should increment attempts on failed authentication', async () => {
      const mockAuthFn = vi.fn().mockRejectedValue(new Error('Auth failed'));

      try {
        await rateLimiter.withRateLimit({ ip: testIp }, mockAuthFn);
      } catch (error) {
        // Expected error
      }

      const attempts = await rateLimiter.getAttempts(
        `rate-limit:ip:${rateLimiter.hashIp(testIp)}`
      );
      expect(attempts).toBe(1);
    });

    it('should enforce rate limit after max attempts', async () => {
      const mockAuthFn = vi.fn().mockRejectedValue(new Error('Auth failed'));

      // Make max attempts + 1
      for (let i = 0; i < rateLimiter.MAX_ATTEMPTS + 1; i++) {
        try {
          await rateLimiter.withRateLimit({ ip: testIp }, mockAuthFn);
        } catch (error) {
          // Expected error
        }
      }

      // Try one more time
      await expect(
        rateLimiter.withRateLimit({ ip: testIp }, mockAuthFn)
      ).rejects.toThrow('Too many attempts');
    });

    it('should enforce rate limit separately for IP and userId', async () => {
      const mockAuthFn = vi.fn().mockRejectedValue(new Error('Auth failed'));

      // Max out IP attempts
      for (let i = 0; i < rateLimiter.MAX_ATTEMPTS + 1; i++) {
        try {
          await rateLimiter.withRateLimit({ ip: testIp }, mockAuthFn);
        } catch (error) {
          // Expected error
        }
      }

      // Try with a different IP but same userId
      const differentIp = '192.168.1.1';
      const result = await rateLimiter.withRateLimit(
        { ip: differentIp, userId: testUserId },
        () => Promise.resolve(true)
      );

      expect(result).toBe(true);
    });

    it('should respect exponential backoff', async () => {
      const mockAuthFn = vi.fn().mockRejectedValue(new Error('Auth failed'));

      // Make more than max attempts
      for (let i = 0; i < rateLimiter.MAX_ATTEMPTS + 2; i++) {
        try {
          await rateLimiter.withRateLimit({ ip: testIp }, mockAuthFn);
        } catch (error) {
          // Expected error
        }
      }

      const lastAttemptTime = await rateLimiter.getLastAttemptTime(
        `rate-limit:ip:${rateLimiter.hashIp(testIp)}`
      );
      const backoffTime = rateLimiter.calculateBackoffTime(
        rateLimiter.MAX_ATTEMPTS + 2
      );
      const timeRemaining = rateLimiter.calculateTimeRemaining(
        lastAttemptTime,
        backoffTime
      );

      expect(timeRemaining).toBeGreaterThan(0);
      expect(timeRemaining).toBeLessThanOrEqual(rateLimiter.MAX_BACKOFF);
    });

    it('should clean up rate limit data after successful reset', async () => {
      const mockAuthFn = vi.fn().mockResolvedValue(true);

      // Make a successful attempt
      await rateLimiter.withRateLimit({ ip: testIp }, mockAuthFn);

      const attempts = await rateLimiter.getAttempts(
        `rate-limit:ip:${rateLimiter.hashIp(testIp)}`
      );
      const lastAttemptTime = await rateLimiter.getLastAttemptTime(
        `rate-limit:ip:${rateLimiter.hashIp(testIp)}`
      );

      expect(attempts).toBe(0);
      expect(lastAttemptTime).toBe(0);
    });
  });
});
