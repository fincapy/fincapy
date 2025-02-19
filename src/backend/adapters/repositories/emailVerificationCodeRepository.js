import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import crypto, { hash } from 'crypto';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || 'key', 'base64');
const IV_LENGTH = 12;

const intToBuffer = (num) => {
  const buffer = Buffer.alloc(3); // 3 bytes are enough for a 6-digit number
  buffer.writeUIntBE(num, 0, 3); // Big-endian, 3 bytes
  return buffer;
};

const bufferToInt = (buffer) => {
  return buffer.readUIntBE(0, 3); // Read as big-endian 3-byte integer
};

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

class EmailVerificationCodeRepository {
  constructor({ redisAdapter, transactionBuilder }) {
    this.redisAdapter = redisAdapter;
    this.transactionBuilder = transactionBuilder;
  }

  async set({ emailVerificationCode, userId, ttl }) {
    const buffer = intToBuffer(emailVerificationCode);
    const encryptedEmailVerificationCode = encrypt(buffer);
    if (this.transactionBuilder) {
      this.transactionBuilder.addSetWithExpiry(
        `emailVerificationCode:user:${userId}`,
        encryptedEmailVerificationCode,
        ttl
      );
    } else {
      await this.redisAdapter.setWithExpiry(
        `emailVerificationCode:user:${userId}`,
        encryptedEmailVerificationCode,
        ttl
      );
    }
  }

  async delete({ userId }) {
    if (this.transactionBuilder) {
      this.transactionBuilder.addDel(`emailVerificationCode:user:${userId}`);
    } else {
      await this.redisAdapter.delete(`emailVerificationCode:user:${userId}`);
    }
  }

  async get({ userId }) {
    const encryptedEmailVerificationCode = await this.redisAdapter.get(
      `emailVerificationCode:user:${userId}`
    );
    if (encryptedEmailVerificationCode === null) {
      return null;
    }
    const decryptedEmailVerificationCode = decrypt(
      encryptedEmailVerificationCode
    );
    return bufferToInt(decryptedEmailVerificationCode);
  }
}

export { EmailVerificationCodeRepository };
