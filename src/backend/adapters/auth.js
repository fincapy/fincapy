import crypto, { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { Session } from '../domain/session';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SESSION_TTL = 60 * 60 * 3; // 3 hours
const ROTATION_PERIOD = 15 * 60; // 15 minutes

class SessionManager {
  constructor({ sessionRepository }) {
    this.sessionRepository = sessionRepository;
  }

  async deleteCookie({ res, cookies }) {
    if (cookies) {
      cookies.set('session-id', '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    } else if (res) {
      res.cookies.set('session-id', '', {
        maxAge: 0,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
  }

  async setCookie({ res, cookies, sessionId }) {
    const sessionToken = jwt.sign(
      { sessionId, type: 'session' },
      process.env.JWT_SECRET,
      {
        expiresIn: '3h',
        algorithm: 'HS256',
      }
    );
    if (cookies) {
      cookies.set('session-id', sessionToken, {
        maxAge: SESSION_TTL,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    } else if (res) {
      res.cookies.set('session-id', sessionToken, {
        maxAge: SESSION_TTL,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    }
  }

  async touchSession({ req, res, cookies }) {
    if (cookies) {
      if (!cookies.set) {
        throw new Error('Attempting to use touchSession in a server component');
      }
    }
    const providedSessionToken =
      (cookies
        ? cookies.get('session-id')?.value
        : req.cookies.get('session-id')?.value) || '';

    let providedSessionId;
    try {
      providedSessionId = jwt.verify(
        providedSessionToken,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] }
      );
    } catch (error) {
      return false;
    }
    if (providedSessionId.type !== 'session') {
      return false;
    }

    const session = await this.sessionRepository.get({
      sessionId: providedSessionId.sessionId,
    });

    if (!session) {
      this.deleteCookie({ res, cookies });
      return false;
    }

    if (Date.now() - session.createdAt > SESSION_TTL * 1000) {
      await this.sessionRepository.delete({
        sessionId: providedSessionId.sessionId,
      });
      this.deleteCookie({ res, cookies });
      return false;
    }

    if (Date.now() - session.createdAt > ROTATION_PERIOD * 1000) {
      await this.sessionRepository.delete({
        sessionId: providedSessionId.sessionId,
      });
      const newSession = new Session({
        sessionId: crypto.randomUUID(),
        userRole: session.userRole,
        userId: session.userId,
        tenantId: session.tenantId,
        createdAt: Date.now(),
        lastRotated: Date.now(),
      });
      await this.sessionRepository.set({
        session: newSession,
        ttl: SESSION_TTL,
      });
      this.setCookie({ res, cookies, sessionId: newSession.sessionId });
      return newSession;
    }
    return session;
  }

  async deleteSession({ sessionId, cookies }) {
    await this.sessionRepository.delete({ sessionId });
    cookies.set('session-id', '', {
      maxAge: 0,
    });
    return true;
  }

  async getSession({ req, cookies }) {
    const providedSessionToken =
      (cookies
        ? cookies.get('session-id')?.value
        : req.cookies.get('session-id')?.value) || '';

    let providedSessionId;
    try {
      providedSessionId = jwt.verify(
        providedSessionToken,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] }
      );
    } catch (error) {
      return false;
    }
    if (providedSessionId.type !== 'session') {
      return false;
    }

    const session = await this.sessionRepository.get({
      sessionId: providedSessionId.sessionId,
    });

    if (!session) {
      return false;
    }

    if (Date.now() - session.createdAt > SESSION_TTL * 1000) {
      return false;
    }
    return session;
  }

  async createSession({ userId, userRole, tenantId, cookies, res }) {
    // Check if user already has 3 active sessions
    const sessionCount =
      await this.sessionRepository.getUserSessionCount(userId);

    // If user already has 3 or more sessions, remove the oldest one
    if (sessionCount >= 3) {
      await this.sessionRepository.deleteOldestSession(userId);
    }

    const session = new Session({
      sessionId: crypto.randomUUID(),
      userId,
      userRole,
      tenantId,
      createdAt: Date.now(),
      lastRotated: Date.now(),
    });
    await this.sessionRepository.set({ session, ttl: SESSION_TTL });
    this.setCookie({ res, cookies, sessionId: session.sessionId });
    return session;
  }

  async getUserSessions(userId) {
    return await this.sessionRepository.getUserSessions(userId);
  }
}

class EmailPasswordAuthenticator {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async authenticate({ unauthenticatedPassword, password }) {
    const dummyHash = await bcrypt.hash(crypto.randomUUID(), 12);
    const valid = await bcrypt.compare(
      unauthenticatedPassword || crypto.randomUUID(),
      password || dummyHash
    );
    if (!valid) {
      return false;
    }
    return true;
  }
}

export { SessionManager, EmailPasswordAuthenticator };
