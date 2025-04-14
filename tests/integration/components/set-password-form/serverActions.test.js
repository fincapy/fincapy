import {
  setInitialPassword,
  resetPassword,
} from '@/components/set-password-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { Session } from '@/backend/domain/session';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => {
  return {
    redirect: vi.fn(),
  };
});

const userId = uuidv4();
const tenantId = uuidv4();
const validPassword = 'ValidPass123!';
const invalidPassword = 'weak';

// Mock cookies functionality
const mockCookiesSet = {
  set: vi.fn(),
};

describe('Set Password Form Server Actions', () => {
  let userRepository;
  let redisAdapter;
  let user;
  let consoleSpy;

  beforeAll(async () => {
    redisAdapter = new RedisAdapter({ redisClient });
    userRepository = new UserRepository({ redisAdapter });

    // Create a test user
    user = {
      id: userId,
      tenantId,
      emails: [{ email: 'test@example.com', verified: false }],
      mfa_method: 'totp',
    };

    await userRepository.set({ userId, user });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    mockCookiesSet.set.mockClear();
    consoleSpy = vi.spyOn(console, 'log');
  });

  describe('setInitialPassword', () => {
    it('should successfully set initial password and return true', async () => {
      cookies.mockResolvedValue(mockCookiesSet);
      const token = jwt.sign(
        { userId, type: 'inviteUser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await setInitialPassword(validPassword, token);

      // Since setInitialPassword redirects and doesn't return a value, we verify side effects
      expect(mockCookiesSet.set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: '/',
          sameSite: 'strict',
          maxAge: 600000,
        })
      );

      // Verify the user's password was updated and email marked as verified
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.emails[0].verified).toBe(true);
      expect(updatedUser.password).toBeDefined();

      // Verify password was hashed correctly
      const passwordMatch = await bcrypt.compare(
        validPassword,
        updatedUser.password
      );
      expect(passwordMatch).toBe(true);
    });

    it('should terminate all active sessions when initial password is set', async () => {
      cookies.mockResolvedValue(mockCookiesSet);
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });

      // Create a session for the user
      const userSession = new Session({
        sessionId: uuidv4(),
        userId: userId,
        userRole: 'owner',
        tenantId: tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });

      await sessionRepository.set({
        session: userSession,
        ttl: 60 * 60 * 3, // 3 hours
      });

      // Verify session exists before setting password
      const sessionsBefore = await sessionRepository.getUserSessions(userId);
      expect(sessionsBefore.length).toBeGreaterThan(0);

      // Set initial password
      const token = jwt.sign(
        { userId, type: 'inviteUser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      await setInitialPassword(validPassword, token);

      // Verify all sessions were terminated
      const sessionsAfter = await sessionRepository.getUserSessions(userId);
      expect(sessionsAfter.length).toBe(0);
    });

    it('should validate password requirements and return error message', async () => {
      const token = jwt.sign(
        { userId, type: 'inviteUser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await setInitialPassword(invalidPassword, token);

      expect(result).toEqual({
        success: false,
        message: expect.stringContaining(
          'Password must be at least 8 characters long'
        ),
      });
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
    });

    it('should return false with invalid token', async () => {
      const invalidToken = jwt.sign(
        { userId, type: 'wrongType' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await setInitialPassword(validPassword, invalidToken);

      expect(result).toBe(false);
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid token type in setInitialPassword - expected inviteUser'
      );
    });

    it('should return false with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId, type: 'inviteUser' },
        process.env.JWT_SECRET,
        { expiresIn: '-10s', algorithm: 'HS256' }
      );

      const result = await setInitialPassword(validPassword, expiredToken);

      expect(result).toBe(false);
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid or expired token in setInitialPassword'
      );
    });

    it('should return false with non-existent user', async () => {
      const nonExistentToken = jwt.sign(
        { userId: uuidv4(), type: 'inviteUser' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await setInitialPassword(validPassword, nonExistentToken);

      expect(result).toBe(false);
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'User not found in setInitialPassword'
      );
    });
  });

  describe('resetPassword', () => {
    it('should successfully reset password and return true', async () => {
      cookies.mockResolvedValue(mockCookiesSet);
      const token = jwt.sign(
        { userId, type: 'resetPassword' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await resetPassword(validPassword, token);

      expect(result).toBe(true);
      expect(mockCookiesSet.set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedToken',
        expect.any(String),
        expect.objectContaining({
          httpOnly: true,
          path: '/',
          sameSite: 'strict',
          maxAge: 600000,
        })
      );

      // Verify the user's password was updated
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.emails[0].verified).toBe(true);

      // Verify password was hashed correctly
      const passwordMatch = await bcrypt.compare(
        validPassword,
        updatedUser.password
      );
      expect(passwordMatch).toBe(true);
    });

    it('should terminate all active sessions when password is reset', async () => {
      cookies.mockResolvedValue(mockCookiesSet);
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });

      // Create a session for the user
      const userSession = new Session({
        sessionId: uuidv4(),
        userId: userId,
        userRole: 'owner',
        tenantId: tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });

      await sessionRepository.set({
        session: userSession,
        ttl: 60 * 60 * 3, // 3 hours
      });

      // Verify session exists before password reset
      const sessionsBefore = await sessionRepository.getUserSessions(userId);
      expect(sessionsBefore.length).toBeGreaterThan(0);

      // Reset password
      const token = jwt.sign(
        { userId, type: 'resetPassword' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await resetPassword(validPassword, token);

      expect(result).toBe(true);

      // Verify all sessions were terminated
      const sessionsAfter = await sessionRepository.getUserSessions(userId);
      expect(sessionsAfter.length).toBe(0);
    });

    it('should validate password requirements and return error message', async () => {
      const token = jwt.sign(
        { userId, type: 'resetPassword' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await resetPassword(invalidPassword, token);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Validation error in resetPassword'
      );
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
    });

    it('should return false with invalid token', async () => {
      const invalidToken = jwt.sign(
        { userId, type: 'wrongType' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await resetPassword(validPassword, invalidToken);

      expect(result).toBe(false);
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid token type in resetPassword - expected resetPassword'
      );
    });

    it('should return false with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId, type: 'resetPassword' },
        process.env.JWT_SECRET,
        { expiresIn: '-10s', algorithm: 'HS256' }
      );

      const result = await resetPassword(validPassword, expiredToken);

      expect(result).toBe(false);
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid or expired token in resetPassword'
      );
    });

    it('should return false with non-existent user', async () => {
      const nonExistentToken = jwt.sign(
        { userId: uuidv4(), type: 'resetPassword' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await resetPassword(validPassword, nonExistentToken);

      expect(result).toBe(false);
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'User not found in resetPassword'
      );
    });
  });
});
