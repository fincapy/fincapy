import { Packr } from 'msgpackr';
import zlib from 'zlib';
import { promisify } from 'util';
import { encrypt, decrypt, hashSessionId } from './encryptionUtils.js';

const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

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
    const sessionKey = `session:${hashSessionId(session.sessionId)}`;
    const userSessionsKey = `user_sessions:${session.userId}`;

    if (this.transactionBuilder) {
      this.transactionBuilder.addSetWithExpiry(
        sessionKey,
        encryptedSession,
        ttl
      );
      this.transactionBuilder.addSadd(userSessionsKey, session.sessionId);
      // Set TTL for user_sessions key to prevent orphaned keys
      this.transactionBuilder.addCommand('EXPIRE', [userSessionsKey, ttl * 2]);
    } else {
      await this.redisAdapter.setWithExpiry(sessionKey, encryptedSession, ttl);
      await this.redisAdapter.sadd(userSessionsKey, session.sessionId);
      // Set TTL for user_sessions key to prevent orphaned keys
      await this.redisAdapter.client.expire(userSessionsKey, ttl * 2);
    }
  }

  async delete({ sessionId }) {
    const session = await this.get({ sessionId });
    if (session) {
      const userSessionsKey = `user_sessions:${session.userId}`;

      if (this.transactionBuilder) {
        this.transactionBuilder.addDel(`session:${hashSessionId(sessionId)}`);
        this.transactionBuilder.addSrem(userSessionsKey, sessionId);
      } else {
        await this.redisAdapter.delete(`session:${hashSessionId(sessionId)}`);
        await this.redisAdapter.srem(userSessionsKey, sessionId);
      }
    } else {
      if (this.transactionBuilder) {
        this.transactionBuilder.addDel(`session:${hashSessionId(sessionId)}`);
      } else {
        await this.redisAdapter.delete(`session:${hashSessionId(sessionId)}`);
      }
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

  async getUserSessionCount(userId) {
    return await this.redisAdapter.scard(`user_sessions:${userId}`);
  }

  async getUserSessions(userId) {
    const sessionIds = await this.redisAdapter.smembers(
      `user_sessions:${userId}`
    );
    const sessions = [];

    for (const sessionId of sessionIds) {
      const session = await this.get({ sessionId });
      if (session) {
        sessions.push(session);
      } else {
        // Clean up stale session references
        await this.redisAdapter.srem(`user_sessions:${userId}`, sessionId);
      }
    }

    return sessions;
  }

  async deleteOldestSession(userId) {
    const sessions = await this.getUserSessions(userId);

    if (sessions.length === 0) {
      return false;
    }

    // Sort sessions by creation time (oldest first)
    sessions.sort((a, b) => a.createdAt - b.createdAt);

    // Delete the oldest session
    await this.delete({ sessionId: sessions[0].sessionId });
    return true;
  }
}

export { SessionRepository };
