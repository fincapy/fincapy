import crypto, { timingSafeEqual } from 'crypto';
import bcrypt from 'bcryptjs';
import { Session } from '../domain/session';
import jwt from 'jsonwebtoken';

const SESSION_TTL = 60 * 60; // 1 hour
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
    const sessionToken = jwt.sign({ sessionId }, process.env.JWT_SECRET, {
      expiresIn: '3h',
    });
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
        process.env.JWT_SECRET
      );
    } catch (error) {
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
      await this.sessionRepository.delete({ sessionId: providedSessionId });
      this.deleteCookie({ res, cookies });
      return false;
    }

    if (Date.now() - session.createdAt > ROTATION_PERIOD * 1000) {
      await this.sessionRepository.delete({ sessionId: providedSessionId });
      const newSession = new Session({
        sessionId: crypto.randomUUID(),
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
      return session;
    }
    return session;
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
        process.env.JWT_SECRET
      );
    } catch (error) {
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

  async createSession({ userId, tenantId, cookies, res }) {
    const session = new Session({
      sessionId: crypto.randomUUID(),
      userId,
      tenantId,
      createdAt: Date.now(),
      lastRotated: Date.now(),
    });
    await this.sessionRepository.set({ session, ttl: SESSION_TTL });
    this.setCookie({ res, cookies, sessionId: session.sessionId });
    return session;
  }
}

class EmailPasswordAuthenticator {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async authenticate({ unauthenticatedPassword, password }) {
    const dummyPassword = crypto.randomUUID();
    const valid = await bcrypt.compare(
      unauthenticatedPassword || dummyPassword,
      password
    );
    if (!valid) {
      return false;
    }
    return true;
  }
}

export { SessionManager, EmailPasswordAuthenticator };
