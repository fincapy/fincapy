export class RateLimiter {
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
  }

  async getAttempts(key) {
    const count = await this.redisAdapter.get(`ratelimit:${key}`);
    return count ? parseInt(count, 10) : 0;
  }

  async isRateLimited({ key, limit, windowInSeconds, backoffThreshold = 10 }) {
    const currentCount = await this.redisAdapter.incr(`ratelimit:${key}`);

    // Set expiry on first hit
    if (currentCount === 1) {
      await this.redisAdapter.setWithExpiry(
        `ratelimit:${key}`,
        '1',
        windowInSeconds
      );
    }

    // If under backoffThreshold, use normal rate limiting
    if (currentCount <= backoffThreshold) {
      return currentCount > limit;
    }

    // Calculate exponential backoff window after exceeding threshold
    const attemptsOverThreshold = currentCount - backoffThreshold;
    const backoffWindowSeconds = Math.min(
      windowInSeconds * Math.pow(2, Math.floor(attemptsOverThreshold / limit)),
      60 * 60 * 24 // Max 24 hours
    );

    // Update expiry with new backoff window
    await this.redisAdapter.setWithExpiry(
      `ratelimit:${key}`,
      currentCount.toString(),
      backoffWindowSeconds
    );

    return true;
  }

  async checkRateLimit({
    key,
    limit = 10,
    windowInSeconds = 60,
    backoffThreshold = 10,
  }) {
    const isLimited = await this.isRateLimited({
      key,
      limit,
      windowInSeconds,
      backoffThreshold,
    });

    if (isLimited) {
      const attempts = await this.getAttempts(key);

      if (attempts <= backoffThreshold) {
        throw new Error(`Too many attempts. Please try again in 1 minute.`);
      } else {
        const attemptsOverThreshold = attempts - backoffThreshold;
        const backoffMinutes = Math.min(
          Math.pow(2, Math.floor(attemptsOverThreshold / limit)),
          1440 // Max 24 hours
        );
        throw new Error(
          `Too many attempts. Please try again in ${backoffMinutes} minutes.`
        );
      }
    }
  }
}
