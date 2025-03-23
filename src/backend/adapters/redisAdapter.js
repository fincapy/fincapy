import Redis from 'ioredis';
import crypto from 'crypto';

const options = {};
if (process.env.NODE_ENV === 'production') {
  options.family = 6;
}
const redisClient = new Redis(process.env.REDIS_URL, options);
const MESSAGE_RETENTION_MILLISECONDS = 1000 * 60 * 60 * 24 * 7; // 7 days

class RedisAdapter {
  constructor({ redisClient }) {
    this.client = redisClient;
  }

  async lpush(key, value) {
    await this.client.lpush(key, value);
  }

  async lrange(key, start, end) {
    return await this.client.lrange(key, start, end);
  }

  async multiNoPipeline() {
    await this.client.multi({ pipeline: false });
  }

  async expire(key, seconds) {
    await this.client.expire(key, seconds);
  }

  async get(key) {
    const result = await this.client.getBuffer(key);
    return result;
  }

  async getWithTransaction(key) {
    await this.client.watch(key);
    const result = await this.client.getBuffer(key);
    return result;
  }

  streamToAsyncIterator(stream) {
    return {
      [Symbol.asyncIterator]() {
        const chunks = [];
        let done = false;

        stream.on('data', (keys) => chunks.push(keys));
        stream.on('end', () => (done = true));
        stream.on('error', (err) => {
          throw err;
        });

        return {
          async next() {
            while (!done || chunks.length > 0) {
              const keys = chunks.shift();
              if (keys) {
                return { value: keys, done: false };
              }
              await new Promise((resolve) => setImmediate(resolve));
            }
            return { value: undefined, done: true };
          },
        };
      },
    };
  }

  async scanStream(pattern) {
    const result = [];
    const stream = this.client.scanStream({ match: pattern });
    for await (const keys of this.streamToAsyncIterator(stream)) {
      result.push(...keys);
    }
    return result;
  }

  async set(key, value) {
    await this.client.set(key, value);
  }

  async delete(key) {
    await this.client.del(key);
  }

  async setWithExpiry(key, value, expiry) {
    await this.client.set(key, value, 'EX', expiry);
  }

  async changeExpiry(key, expiry) {
    await this.client.expire(key, expiry);
  }

  async incr(key) {
    const result = await this.client.incr(key);
    return result;
  }

  async exec() {
    await this.client.exec();
  }

  async discard() {
    await this.client.discard();
  }

  async unwatch() {
    await this.client.unwatch();
  }

  async executeLuaScript(script, keys, args) {
    const result = await this.client.eval(
      script,
      keys.length,
      ...keys,
      ...args
    );
    return result;
  }

  async xadd(streamName, messageType, message) {
    const retentionTimestamp = Date.now() - MESSAGE_RETENTION_MILLISECONDS;
    await redis.xadd(
      streamName,
      'MINID',
      '~',
      retentionTimestamp,
      '*',
      'messageType',
      messageType,
      'message',
      message
    );
  }

  async createConsumerGroup(streamName, groupName) {
    try {
      await this.client.xgroup('CREATE', streamName, groupName, 0, 'MKSTREAM');
      console.log('Consumer group created.');
    } catch (err) {
      if (err.message.includes('BUSYGROUP')) {
        console.log('Consumer group already exists.');
      } else {
        throw err;
      }
    }
  }

  async xack(streamName, groupName, messageId) {
    await this.client.xack(streamName, groupName, messageId);
  }

  async xreadgroup({
    groupName,
    consumerName,
    count,
    block,
    streamName,
    readPending,
  }) {
    const result = await this.client.xreadgroup(
      'GROUP',
      groupName,
      consumerName,
      'COUNT',
      count,
      'BLOCK',
      block,
      'STREAMS',
      streamName,
      readPending ? '0' : '>'
    );
    return result;
  }

  async sadd(key, ...members) {
    const result = await this.client.sadd(key, ...members);
    return result;
  }

  async smembers(key) {
    const result = await this.client.smembers(key);
    return result;
  }

  async scard(key) {
    const result = await this.client.scard(key);
    return result;
  }

  async srem(key, ...members) {
    const result = await this.client.srem(key, ...members);
    return result;
  }
}

class RedisLuaTransactionBuilder {
  /**
   * @param {string} versionKey - The Redis key that holds the version.
   */
  constructor() {
    this.commands = [];
    this.watchedVersions = new Map();
  }

  /**
   * Adds a command to the queue.
   * Each command is an object with a "cmd" (the Redis command)
   * and "args" (an array of arguments).
   *
   * @param {string} cmd - The Redis command (e.g., "SET", "DEL").
   * @param {Array<any>} args - The arguments for the command.
   */
  addCommand(cmd, args) {
    this.commands.push({ cmd, args });
  }

  /**
   * Convenience method to add a SET command.
   *
   * @param {string} key - The key to set.
   * @param {Buffer|string} value - The value to set (Buffer for raw bytes).
   */
  addSet(key, value) {
    this.addCommand('SET', [key, value]);
  }

  addSetWithExpiry(key, value, expiry) {
    this.addCommand('SET', [key, value, 'EX', expiry]);
  }

  addIncr(key) {
    this.addCommand('INCR', [key]);
  }

  addXAdd(streamName, messageType, message) {
    const retentionTimestamp = Date.now() - MESSAGE_RETENTION_MILLISECONDS;
    this.addCommand('XADD', [
      streamName,
      'MINID',
      '~',
      retentionTimestamp,
      '*',
      'messageType',
      messageType,
      'message',
      message,
    ]);
  }

  xAck(streamName, groupName, messageId) {
    this.addCommand('XACK', [streamName, groupName, messageId]);
  }

  /**
   * Convenience method to add a DEL command.
   *
   * @param {string} key - The key to delete.
   */
  addDel(key) {
    this.addCommand('DEL', [key]);
  }

  watchVersion(versionKey, version) {
    this.watchedVersions.set(versionKey, version);
  }

  addSadd(key, ...members) {
    this.addCommand('SADD', [key, ...members]);
  }

  addSrem(key, ...members) {
    this.addCommand('SREM', [key, ...members]);
  }

  /**
   * Generates a Lua script and its associated ARGV array.
   *
   * If a versionKey is provided, the script:
   *  1. Checks that the current version stored at versionKey (KEYS[1])
   *     equals the expected version (ARGV[1]).
   *  2. Executes each queued command using ARGV (starting at ARGV[2]).
   *  3. Increments the version and returns the new version.
   *
   * If no versionKey is provided, the script:
   *  1. Executes the queued commands.
   *  2. Returns "OK".
   *
   * @returns {{ script: string, args: Array<any> }} - The Lua script and ARGV values.
   */
  generateScript() {
    const lines = [];
    const args = [];
    const keys = [];
    let argIndex = 1; // Starting index for ARGV placeholders

    // If versionKey is provided, include version checking logic.
    for (const [versionKey, watchedVersion] of this.watchedVersions) {
      args.push(watchedVersion);
      keys.push(versionKey);
      lines.push(
        `local currentVersion${argIndex} = redis.call("GET", KEYS[${argIndex}])`
      );
      lines.push(`if currentVersion${argIndex} ~= ARGV[${argIndex}] then`);
      lines.push(`  return {err = "Version mismatch"}`);
      lines.push(`end`);
      argIndex++;
    }

    // Execute each queued command using ARGV placeholders.
    for (const command of this.commands) {
      const placeholders = [];
      for (let i = 0; i < command.args.length; i++) {
        placeholders.push(`ARGV[${argIndex}]`);
        args.push(command.args[i]);
        argIndex++;
      }
      lines.push(`redis.call("${command.cmd}", ${placeholders.join(', ')})`);
    }

    let keyIndex = 1;
    for (const [versionKey, watchedVersion] of this.watchedVersions) {
      lines.push(`redis.call("INCR", KEYS[${keyIndex}])`);
      keyIndex++;
    }
    lines.push(`return "OK"`);

    const script = lines.join('\n');
    return { script, keys, args };
  }
}

export { RedisAdapter, RedisLuaTransactionBuilder, redisClient };
