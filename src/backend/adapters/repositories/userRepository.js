import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';
import { User } from '@/backend/domain/user';

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
  constructor({ redisAdapter }) {
    this.redisAdapter = redisAdapter;
  }

  async getByEmail({ email }) {
    const emailHash = hashEmail(email);
    const userId = await this.redisAdapter.get(`user:email:${emailHash}`);
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
    await this.redisAdapter.set(`user:email:${emailHash}`, userId);
  }

  async get({ userId }) {
    // hash email for use as key
    const userObject = await this.redisAdapter.get(`user:${userId}`);
    if (userObject === null) {
      return null;
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
    await this.redisAdapter.set(`user:${userId}`, encryptedUser);
  }
}

export { UserRepository };
