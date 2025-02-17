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
    const operationId = crypto.randomUUID();
    console.time(`scan - ${operationId}`);
    const result = [];
    const stream = this.client.scanStream({ match: pattern });
    for await (const keys of this.streamToAsyncIterator(stream)) {
      result.push(...keys);
    }
    console.timeEnd(`scan - ${operationId}`);
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

  async incr(key) {
    const operationId = crypto.randomUUID();
    console.time(`incr - ${operationId}`);
    const result = await this.client.incr(key);
    console.timeEnd(`incr - ${operationId}`);
    return result;
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

  async executeLuaScript(script, versionKey, args) {
    const operationId = crypto.randomUUID();
    console.time(`eval - ${operationId}`);
    const result = await this.client.eval(script, 1, versionKey, ...args);
    console.timeEnd(`eval - ${operationId}`);
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
    const operationId = crypto.randomUUID();
    console.time(`xack - ${operationId}`);
    await this.client.xack(streamName, groupName, messageId);
    console.timeEnd(`xack - ${operationId}`);
  }

  async xreadgroup({
    groupName,
    consumerName,
    count,
    block,
    streamName,
    readPending,
  }) {
    const operationId = crypto.randomUUID();
    console.time(`xreadgroup - ${operationId}`);
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
    console.timeEnd(`xreadgroup - ${operationId}`);
    return result;
  }
}

class RedisLuaTransactionBuilder {
  /**
   * @param {string} versionKey - The Redis key that holds the version.
   */
  constructor() {
    this.commands = [];
    this.watchedVersion = null;
    this.versionKey = null; // Set this to a non-null value to enable version checking.
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

  watchVersion(version) {
    this.watchedVersion = version;
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
    let argIndex = 1; // Starting index for ARGV placeholders

    // If versionKey is provided, include version checking logic.
    if (this.versionKey !== null) {
      // ARGV[1] is reserved for the expected version.
      args.push(this.watchedVersion);
      lines.push(`local currentVersion = redis.call("GET", KEYS[1])`);
      lines.push(`if currentVersion ~= ARGV[1] then`);
      lines.push(`  return {err = "Version mismatch"}`);
      lines.push(`end`);
      argIndex = 2;
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

    if (this.versionKey !== null) {
      // If version checking is enabled, increment the version and return the new version.
      lines.push(`redis.call("INCR", KEYS[1])`);
    } else {
      // Otherwise, simply return a success message.
      lines.push(`return "OK"`);
    }

    const script = lines.join('\n');
    return { script, args };
  }
}

export { RedisAdapter, RedisLuaTransactionBuilder, redisClient };
