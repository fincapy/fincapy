import crypto, { timingSafeEqual } from 'crypto';
import { Session } from '../domain/session';

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
    if (cookies) {
      cookies.set('session-id', sessionId, {
        maxAge: SESSION_TTL,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
    } else if (res) {
      res.cookies.set('session-id', sessionId, {
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
    const providedSessionId = cookies
      ? cookies.get('session-id')?.value
      : req.cookies.get('session-id')?.value;
    if (!providedSessionId) {
      return false;
    }
    
    // Convert session ID to buffers for timing-safe comparison
    const providedBuffer = Buffer.from(providedSessionId);
    const session = await this.sessionRepository.get({ sessionId: providedSessionId });
    if (session === null) {
      this.deleteCookie({ res, cookies });
      return false;
    }
    if (Date.now() - session.createdAt > SESSION_TTL) {
      await sessionRepository.delete({ sessionId });
      this.deleteCookie({ res, cookies });
      return false;
    }

    if (Date.now() - session.createdAt > ROTATION_PERIOD) {
      await sessionRepository.delete({ sessionId });
      const newSession = new Session({
        sessionId: crypto.randomUUID(),
        userId,
        createdAt: Date.now(),
        lastRotated: Date.now(),
      });
      await sessionRepository.set({ session: newSession });
      this.setCookie({ res, cookies, sessionId: newSession.sessionId });
      return session;
    }
    return session;
  }

  async getSession({ req, cookies }) {
    const providedSessionId = cookies
      ? cookies.get('session-id')?.value
      : req.cookies.get('session-id')?.value;
    if (!providedSessionId) {
      return false;
    }
    
    // Convert session ID to buffers for timing-safe comparison
    const providedBuffer = Buffer.from(providedSessionId);
    const session = await this.sessionRepository.get({ sessionId: providedSessionId });
    if (session === null) {
      return false;
    }
    if (Date.now() - session.createdAt > SESSION_TTL) {
      return false;
    }
    return session;
  }

  async createSession({ userId, cookies, res }) {
    const session = new Session({
      sessionId: crypto.randomUUID(),
      userId,
      createdAt: Date.now(),
      lastRotated: Date.now(),
    });
    await this.sessionRepository.set({ session });
    this.setCookie({ res, cookies, sessionId: session.sessionId });
    return session;
  }
}

class EmailPasswordAuthenticator {
  constructor({ userRepository }) {
    this.userRepository = userRepository;
  }

  async authenticate({ email, password }) {
    const user = await this.userRepository.getByEmail({ email });
    if (!user) {
      return false;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return false;
    }
    return true;
  }
}

export { SessionManager, EmailPasswordAuthenticator };
