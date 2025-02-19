import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';
import { User } from '../../domain/user.js';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'key', 'base64');
const IV_LENGTH = 12;

function encrypt(data) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

function decrypt(encryptedData) {
  const iv = encryptedData.slice(0, IV_LENGTH);
  const authTag = encryptedData.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = encryptedData.slice(IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex');
}

class UserRepository {
  constructor({ redisAdapter, transactionBuilder }) {
    this.transactionBuilder = transactionBuilder;
    this.redisAdapter = redisAdapter;
  }

  async getByEmail({ email }) {
    const emailHash = hashEmail(email);
    const userId = await this.redisAdapter.get(`email:user:${emailHash}`);
    if (userId === null) {
      return null;
    }
    const user = await this.get({ userId });
    if (!user) {
      throw new Error('Unlinked email');
    }
    return user;
  }

  async setEmailLookup({ email, userId }) {
    const emailHash = hashEmail(email);
    if (this.transactionBuilder) {
      this.transactionBuilder.addSet(`email:user:${emailHash}`, userId);
    } else {
      await this.redisAdapter.set(`email:user:${emailHash}`, userId);
    }
  }

  async incrementVersion({ userId }) {
    if (this.transactionBuilder) {
      this.transactionBuilder.addIncr(`version:user:${userId}`);
    } else {
      await this.redisAdapter.incr(`version:user:${userId}`);
    }
  }

  async get({ userId }) {
    // hash email for use as key
    const userObject = await this.redisAdapter.get(`user:${userId}`);
    if (userObject === null) {
      return null;
    }
    if (this.transactionBuilder) {
      const version = await this.redisAdapter.get(`version:user:${userId}`);
      this.transactionBuilder.watchVersion(`version:user:${userId}`, version);
    }
    const decryptedUser = decrypt(userObject);
    const decompressedUser = await brotliDecompress(decryptedUser);
    const packr = new Packr();
    const unpackedUser = packr.unpack(decompressedUser);
    return new User(unpackedUser);
  }

  async set({ userId, user }) {
    const packr = new Packr();
    const packedUser = packr.pack(user);
    const compressedUser = await brotliCompress(packedUser);
    const encryptedUser = encrypt(compressedUser);
    if (this.transactionBuilder) {
      this.transactionBuilder.addSet(`user:${userId}`, encryptedUser);
    } else {
      await this.redisAdapter.set(`user:${userId}`, encryptedUser);
    }
  }

  async delete({ userId }) {
    if (this.transactionBuilder) {
      this.transactionBuilder.addDel(`user:${userId}`);
    } else {
      await this.redisAdapter.del(`user:${userId}`);
    }
  }
}

export { UserRepository };
