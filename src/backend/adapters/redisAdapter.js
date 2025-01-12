import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

class RedisAdapter {
  constructor({ redisClient }) {
    this.client = redisClient;
  }

  async get(key) {
    const operationId = crypto.randomUUID();
    console.time(`get - ${operationId}`);
    const result = await this.client.getBuffer(key);
    console.timeEnd(`get - ${operationId}`);
    return result;
  }

  async getWithTransaction(key) {
    const operationId = crypto.randomUUID();
    console.time(`getWithTransaction - ${operationId}`);
    await this.client.watch(key);
    const result = await this.client.getBuffer(key);
    console.timeEnd(`getWithTransaction - ${operationId}`);
    return result;
  }

  async set(key, value) {
    const operationId = crypto.randomUUID();
    console.time(`set - ${operationId}`);
    await this.client.multi().set(key, value).exec();
    console.timeEnd(`set - ${operationId}`);
  }
}

export { RedisAdapter, redisClient };
