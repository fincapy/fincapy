import crypto from 'crypto';

class AuthRateLimiter {
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
    this.MAX_ATTEMPTS = 6;
    this.INITIAL_BACKOFF = 5 * 60; // 5 minutes in seconds
    this.MAX_BACKOFF = 24 * 60 * 60; // 24 hours in seconds
  }

  hashIp(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex');
  }

  hashEmail(email) {
    return crypto.createHash('sha256').update(email).digest('hex');
  }

  async withRateLimit({ ip, processId, userId = null }, authFn) {
    if (!ip) {
      throw new Error('IP address is required for rate limiting');
    }

    const hashedIp = this.hashIp(ip);
    const hashedEmail = userId ? this.hashEmail(userId) : null;

    try {
      await this.checkRateLimit(`rate-limit:${processId}:ip:${hashedIp}`);
    } catch (error) {
      console.log('IP Rate limit exceeded');
      return false;
    }

    // If userId is provided, also check user-based rate limit
    if (userId) {
      try {
        await this.checkRateLimit(
          `rate-limit:${processId}:user:${hashedEmail}`
        );
      } catch (error) {
        console.log('User Rate limit exceeded');
        return false;
      }
    }

    try {
      const result = await authFn();
      if (typeof result === 'function') {
        await this.resetAttempts(`rate-limit:${processId}:ip:${hashedIp}`);
        if (userId) {
          await this.resetAttempts(
            `rate-limit:${processId}:user:${hashedEmail}`
          );
        }
        return result();
      } else if (result) {
        // Reset attempts on successful authentication for all identifiers
        await this.resetAttempts(`rate-limit:${processId}:ip:${hashedIp}`);
        if (userId) {
          await this.resetAttempts(
            `rate-limit:${processId}:user:${hashedEmail}`
          );
        }
      } else {
        await this.incrementAttempts(`rate-limit:${processId}:ip:${hashedIp}`);
        if (userId) {
          await this.incrementAttempts(
            `rate-limit:${processId}:user:${hashedEmail}`
          );
        }
        console.log('result', result);
      }
      console.log('result', result);
      return result;
    } catch (error) {
      // Increment attempts on failure for all identifiers
      await this.incrementAttempts(`rate-limit:${processId}:ip:${hashedIp}`);
      if (userId) {
        await this.incrementAttempts(
          `rate-limit:${processId}:user:${hashedEmail}`
        );
      }
      console.log('error', error);
      return false;
    }
  }

  async checkRateLimit(key) {
    const attempts = await this.getAttempts(key);
    const lastAttemptTime = await this.getLastAttemptTime(key);
    const backoffTime = this.calculateBackoffTime(attempts);

    if (backoffTime > 0) {
      const timeRemaining = this.calculateTimeRemaining(
        lastAttemptTime,
        backoffTime
      );
      if (timeRemaining > 0) {
        throw new Error(
          `Too many attempts. Please try again in ${Math.ceil(timeRemaining / 60)} minutes`
        );
      }
    }
  }

  async getAttempts(key) {
    const attempts = await this.redisAdapter.get(`${key}:attempts`);
    return parseInt(attempts) || 0;
  }

  async getLastAttemptTime(key) {
    const time = await this.redisAdapter.get(`${key}:lastAttempt`);
    return parseInt(time) || 0;
  }

  async incrementAttempts(key) {
    const attempts = await this.getAttempts(key);
    const newAttempts = attempts + 1;
    await this.redisAdapter.set(`${key}:attempts`, newAttempts);
    await this.redisAdapter.set(
      `${key}:lastAttempt`,
      Math.floor(Date.now() / 1000)
    );

    // Set expiry for cleanup (48 hours)
    const CLEANUP_TIME = 48 * 60 * 60;
    await this.redisAdapter.expire(`${key}:attempts`, CLEANUP_TIME);
    await this.redisAdapter.expire(`${key}:lastAttempt`, CLEANUP_TIME);
  }

  async resetAttempts(key) {
    await this.redisAdapter.delete(`${key}:attempts`);
    await this.redisAdapter.delete(`${key}:lastAttempt`);
  }

  calculateBackoffTime(attempts) {
    if (attempts <= this.MAX_ATTEMPTS) {
      return 0;
    }

    // Calculate exponential backoff: initial_backoff * 2^(attempts - max_attempts)
    if (attempts - this.MAX_ATTEMPTS === 1) {
      return this.INITIAL_BACKOFF;
    }

    const backoff =
      this.INITIAL_BACKOFF * Math.pow(2, attempts - this.MAX_ATTEMPTS - 1);
    return Math.min(backoff, this.MAX_BACKOFF);
  }

  calculateTimeRemaining(lastAttemptTime, backoffTime) {
    const currentTime = Math.floor(Date.now() / 1000);
    const timeElapsed = currentTime - lastAttemptTime;
    return backoffTime - timeElapsed;
  }
}

export { AuthRateLimiter };
