import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SessionManager,
  EmailPasswordAuthenticator,
} from '../../../../src/backend/adapters/auth';
import { Session } from '../../../../src/backend/domain/session';
import { SessionRepository } from '../../../../src/backend/adapters/repositories/sessionRepository';
import { RedisAdapter } from '../../../../src/backend/adapters/redisAdapter';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const SESSION_TTL_MS = 60 * 60 * 12 * 1000; // 12 hours in milliseconds, same as in auth.js

// Create a fake cookie store for testing
class FakeCookieStore {
  constructor() {
    this.cookies = new Map();
  }

  set(name, value, options) {
    this.cookies.set(name, { value, options });
  }

  get(name) {
    return this.cookies.get(name);
  }

  delete(name) {
    this.cookies.delete(name);
  }
}

// Create a fake request object
class FakeRequest {
  constructor(cookieStore) {
    this.cookies = cookieStore;
  }
}

// Create a fake response object
class FakeResponse {
  constructor(cookieStore) {
    this.cookies = cookieStore;
  }
}

describe('Auth Integration Tests', () => {
  let redisClient;
  let redisAdapter;
  let sessionRepository;
  let sessionManager;
  let emailPasswordAuthenticator;
  let cookieStore;
  let req;
  let res;

  beforeEach(async () => {
    // Setup Redis client
    redisClient = new Redis(process.env.REDIS_URL);
    redisAdapter = new RedisAdapter({ redisClient });
    sessionRepository = new SessionRepository({ redisAdapter });

    // Setup auth components
    sessionManager = new SessionManager({ sessionRepository });
    emailPasswordAuthenticator = new EmailPasswordAuthenticator({
      userRepository: null,
    });

    // Setup fake request/response objects
    cookieStore = new FakeCookieStore();
    req = new FakeRequest(cookieStore);
    res = new FakeResponse(cookieStore);

    // Set test environment variables
    process.env.JWT_SECRET = 'test-secret-key';
    vi.resetAllMocks();
  });

  describe('SessionManager', () => {
    it('should create a new session and set cookie', async () => {
      const userId = uuidv4();
      const userRole = 'user';
      const tenantId = 'test-tenant';

      const session = await sessionManager.createSession({
        userId,
        userRole,
        tenantId,
        cookies: cookieStore,
      });

      // Verify session was created
      expect(session).toBeDefined();
      expect(session.userId).toBe(userId);
      expect(session.userRole).toBe(userRole);
      expect(session.tenantId).toBe(tenantId);

      // Verify cookie was set
      const cookie = cookieStore.get('session-id');
      expect(cookie).toBeDefined();

      // Verify JWT token
      const decoded = jwt.verify(cookie.value, process.env.JWT_SECRET);
      expect(decoded.sessionId).toBe(session.sessionId);
      expect(decoded.type).toBe('session');
    });

    it('should enforce session limit and remove oldest session', async () => {
      const userId = uuidv4();

      // Create 3 sessions
      const session1 = await sessionManager.createSession({
        userId,
        userRole: 'user',
        tenantId: 'tenant1',
        cookies: cookieStore,
      });

      const session2 = await sessionManager.createSession({
        userId,
        userRole: 'user',
        tenantId: 'tenant2',
        cookies: cookieStore,
      });

      const session3 = await sessionManager.createSession({
        userId,
        userRole: 'user',
        tenantId: 'tenant3',
        cookies: cookieStore,
      });

      // Create 4th session - should remove oldest
      const session4 = await sessionManager.createSession({
        userId,
        userRole: 'user',
        tenantId: 'tenant4',
        cookies: cookieStore,
      });

      // Verify session count
      const sessions = await sessionManager.getUserSessions(userId);
      expect(sessions.length).toBe(3);

      // Verify oldest session was removed
      const sessionIds = sessions.map((s) => s.sessionId);
      expect(sessionIds).not.toContain(session1.sessionId);
      expect(sessionIds).toContain(session2.sessionId);
      expect(sessionIds).toContain(session3.sessionId);
      expect(sessionIds).toContain(session4.sessionId);
    });

    it('should touch and rotate session when needed', async () => {
      const userId = uuidv4();

      // Create initial session
      cookieStore.set('session-id', 'test-session-id', {});
      const session = await sessionManager.createSession({
        userId,
        userRole: 'user',
        tenantId: 'test-tenant',
        cookies: cookieStore,
      });

      // Mock time to be after rotation period
      const originalDate = Date.now;
      Date.now = () => session.createdAt + 16 * 60 * 1000; // 16 minutes later

      // Touch session - should rotate
      const touchedSession = await sessionManager.touchSession({
        cookies: cookieStore,
      });

      // Restore Date.now
      Date.now = originalDate;

      // Verify session was rotated
      expect(touchedSession.sessionId).not.toBe(session.sessionId);
      expect(touchedSession.userId).toBe(session.userId);
      expect(touchedSession.userRole).toBe(session.userRole);
      expect(touchedSession.tenantId).toBe(session.tenantId);

      // Verify old session was deleted
      const oldSession = await sessionRepository.get({
        sessionId: session.sessionId,
      });
      expect(oldSession).toBeNull();
    });

    it('should handle invalid session tokens', async () => {
      // Set invalid token
      cookieStore.set('session-id', 'invalid-token', {});

      // Try to touch session
      const result = await sessionManager.touchSession({
        cookies: cookieStore,
      });

      expect(result).toBe(false);
    });

    it('should handle expired sessions', async () => {
      const userId = uuidv4();

      // Set an old session directly in the cookie store
      const sessionId = crypto.randomUUID();
      const oldSession = new Session({
        sessionId,
        userId,
        userRole: 'user',
        tenantId: 'test-tenant',
        createdAt: Date.now() - 100000000,
        lastRotated: Date.now() - 10000000,
      });
      const SESSION_TTL = 1000 * 60 * 60 * 3; // 3 hours
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      await sessionRepository.set({ session: oldSession, ttl: SESSION_TTL });
      cookieStore.set(
        'session-id',
        jwt.sign({ sessionId, type: 'session' }, process.env.JWT_SECRET, {
          expiresIn: '3h',
          algorithm: 'HS256',
        }),
        {
          maxAge: SESSION_TTL,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        }
      );

      // Try to touch session
      const result = await sessionManager.touchSession({
        cookies: cookieStore,
      });

      expect(result).toBe(false);
      // Verify session was deleted
      const deletedSession = await sessionRepository.get({
        sessionId: sessionId,
      });
      expect(deletedSession).toBeNull();
    });

    it('should handle missing session cookie', async () => {
      const touchedSession = await sessionManager.touchSession({
        cookies: cookieStore,
      });

      expect(touchedSession).toBe(false);
    });

    it('should retrieve a valid session', async () => {
      const userId = uuidv4();
      const userRole = 'user';
      const tenantId = 'test-tenant';

      // Create a session
      const createdSession = await sessionManager.createSession({
        userId,
        userRole,
        tenantId,
        cookies: cookieStore,
      });

      // Retrieve the session
      const session = await sessionManager.getSession({
        cookies: cookieStore,
      });

      // Verify session was retrieved correctly
      expect(session).toBeDefined();
      expect(session.sessionId).toBe(createdSession.sessionId);
      expect(session.userId).toBe(userId);
      expect(session.userRole).toBe(userRole);
      expect(session.tenantId).toBe(tenantId);
    });

    it('should redirect when session token is invalid for getSession', async () => {
      // Set invalid token
      cookieStore.set('session-id', 'invalid-token', {});

      // Try to get session
      const result = await sessionManager.getSession({
        cookies: cookieStore,
      });

      expect(result).toBe(false);
    });

    it('should redirect when token type is not session for getSession', async () => {
      // Set token with wrong type
      const wrongTypeToken = jwt.sign(
        { sessionId: uuidv4(), type: 'wrong-type' },
        process.env.JWT_SECRET
      );
      cookieStore.set('session-id', wrongTypeToken, {});

      // Try to get session
      const result = await sessionManager.getSession({
        cookies: cookieStore,
      });

      expect(result).toBe(false);
    });

    it('should redirect when session does not exist for getSession', async () => {
      // Set token with non-existent session ID
      const nonExistentToken = jwt.sign(
        { sessionId: uuidv4(), type: 'session' },
        process.env.JWT_SECRET
      );
      cookieStore.set('session-id', nonExistentToken, {});

      // Try to get session
      const result = await sessionManager.getSession({
        cookies: cookieStore,
      });

      expect(result).toBe(false);
    });

    it('should redirect when session is expired for getSession', async () => {
      const userId = uuidv4();

      // Set an expired session directly in the cookie store
      const sessionId = crypto.randomUUID();
      const expiredSession = new Session({
        sessionId,
        userId,
        userRole: 'user',
        tenantId: 'test-tenant',
        createdAt: Date.now() - SESSION_TTL_MS - 1000, // Expired by 1 second
        lastRotated: Date.now() - 10000000,
      });

      const SESSION_TTL = 1000 * 60 * 60 * 3; // 3 hours
      await sessionRepository.set({
        session: expiredSession,
        ttl: SESSION_TTL / 1000,
      });

      cookieStore.set(
        'session-id',
        jwt.sign({ sessionId, type: 'session' }, process.env.JWT_SECRET, {
          expiresIn: '3h',
          algorithm: 'HS256',
        }),
        {
          maxAge: SESSION_TTL,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        }
      );

      // Try to get session
      const result = await sessionManager.getSession({
        cookies: cookieStore,
      });

      expect(result).toBe(false);
    });

    it('should handle missing session cookie for getSession', async () => {
      // Try to get session with no cookie
      const result = await sessionManager.getSession({
        cookies: cookieStore,
      });

      expect(result).toBe(false);
    });
  });

  describe('EmailPasswordAuthenticator', () => {
    it('should authenticate valid password', async () => {
      const password = 'test-password';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await emailPasswordAuthenticator.authenticate({
        unauthenticatedPassword: password,
        password: hashedPassword,
      });

      expect(isValid).toBe(true);
    });

    it('should reject invalid password', async () => {
      const password = 'test-password';
      const hashedPassword = await bcrypt.hash(password, 10);

      const isValid = await emailPasswordAuthenticator.authenticate({
        unauthenticatedPassword: 'wrong-password',
        password: hashedPassword,
      });

      expect(isValid).toBe(false);
    });

    it('should handle timing attacks by using constant time comparison', async () => {
      // Test that even with missing password, the function takes similar time
      const password = bcrypt.hashSync('test-password', 12);

      // Run multiple iterations to get more reliable results
      const iterations = 5;
      let nullPasswordTimes = [];
      let validPasswordTimes = [];

      for (let i = 0; i < iterations; i++) {
        // Test with null password
        const start1 = process.hrtime.bigint();
        await emailPasswordAuthenticator.authenticate({
          unauthenticatedPassword: 'test-password',
          password: null,
        });
        const end1 = process.hrtime.bigint();
        nullPasswordTimes.push(Number(end1 - start1));

        // Test with valid password
        const start2 = process.hrtime.bigint();
        await emailPasswordAuthenticator.authenticate({
          unauthenticatedPassword: 'test-password',
          password: password,
        });
        const end2 = process.hrtime.bigint();
        validPasswordTimes.push(Number(end2 - start2));
      }

      // Calculate averages
      const avgNullTime =
        nullPasswordTimes.reduce((a, b) => a + b, 0) / iterations;
      const avgValidTime =
        validPasswordTimes.reduce((a, b) => a + b, 0) / iterations;

      // Compare the ratio instead of absolute difference
      // Neither should be more than 3x faster than the other
      const ratio = Math.max(
        avgNullTime / avgValidTime,
        avgValidTime / avgNullTime
      );

      expect(ratio).toBeLessThan(3);
    }, 10000);
  });
});
