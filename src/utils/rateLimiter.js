import { RedisAdapter } from '@/backend/adapters/redisAdapter';

export class RateLimiter {
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
  }

  async isRateLimited({ key, limit, windowInSeconds }) {
    const currentCount = await this.redisAdapter.incr(`ratelimit:${key}`);
    
    // Set expiry on first hit
    if (currentCount === 1) {
      await this.redisAdapter.setWithExpiry(`ratelimit:${key}`, '1', windowInSeconds);
    }
    
    return currentCount > limit;
  }
}
