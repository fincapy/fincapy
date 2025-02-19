import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import crypto from 'crypto';

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

function hashSessionId(sessionId) {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

class SessionRepository {
  constructor({ redisAdapter, transactionBuilder }) {
    this.transactionBuilder = transactionBuilder;
    this.redisAdapter = redisAdapter;
  }

  async set({ session, ttl }) {
    const packr = new Packr();
    const packedSession = packr.pack(session);
    const compressedSession = await brotliCompress(packedSession);
    const encryptedSession = encrypt(compressedSession);

    if (this.transactionBuilder) {
      this.transactionBuilder.addSetWithExpiry(
        `session:${hashSessionId(session.sessionId)}`,
        encryptedSession,
        ttl
      );
    } else {
      await this.redisAdapter.setWithExpiry(
        `session:${hashSessionId(session.sessionId)}`,
        encryptedSession,
        ttl
      );
    }
  }

  async delete({ sessionId }) {
    console.log('sessionId', sessionId);
    if (this.transactionBuilder) {
      this.transactionBuilder.addDel(`session:${hashSessionId(sessionId)}`);
    } else {
      await this.redisAdapter.delete(`session:${hashSessionId(sessionId)}`);
    }
  }

  async get({ sessionId }) {
    const encryptedSession = await this.redisAdapter.get(
      `session:${hashSessionId(sessionId)}`
    );
    if (encryptedSession === null) {
      return null;
    }
    const decryptedSession = decrypt(encryptedSession);
    const decompressedSession = await brotliDecompress(decryptedSession);
    const packr = new Packr();
    const unpackedSession = packr.unpack(decompressedSession);
    return unpackedSession;
  }
}

export { SessionRepository };
