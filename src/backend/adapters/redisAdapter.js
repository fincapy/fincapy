import Redis from 'ioredis';

const options = {};
if (process.env.NODE_ENV === 'production') {
  options.family = 6;
}
const redisClient = new Redis(process.env.REDIS_URL, options);

class RedisAdapter {
  constructor({ redisClient }) {
    this.client = redisClient;
  }

  async multiNoPipeline() {
    await this.client.multi({ pipeline: false });
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
    await this.client.set(key, value);
    console.timeEnd(`set - ${operationId}`);
  }

  async delete(key) {
    const operationId = crypto.randomUUID();
    console.time(`delete - ${operationId}`);
    await this.client.del(key);
    console.timeEnd(`delete - ${operationId}`);
  }

  async setWithExpiry(key, value, expiry) {
    const operationId = crypto.randomUUID();
    console.time(`setWithExpiry - ${operationId}`);
    await this.client.set(key, value, 'EX', expiry);
    console.timeEnd(`setWithExpiry - ${operationId}`);
  }

  async changeExpiry(key, expiry) {
    const operationId = crypto.randomUUID();
    console.time(`changeExpiry - ${operationId}`);
    await this.client.expire(key, expiry);
    console.timeEnd(`changeExpiry - ${operationId}`);
  }

  async exec() {
    const operationId = crypto.randomUUID();
    console.time(`exec - ${operationId}`);
    await this.client.exec();
    console.timeEnd(`exec - ${operationId}`);
  }

  async discard() {
    const operationId = crypto.randomUUID();
    console.time(`discard - ${operationId}`);
    await this.client.discard();
    console.timeEnd(`discard - ${operationId}`);
  }

  async unwatch() {
    const operationId = crypto.randomUUID();
    console.time(`unwatch - ${operationId}`);
    await this.client.unwatch();
    console.timeEnd(`unwatch - ${operationId}`);
  }
}

export { RedisAdapter, redisClient };
