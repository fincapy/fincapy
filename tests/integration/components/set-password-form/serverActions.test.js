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

    it('should validate password requirements and return error message', async () => {
      const token = jwt.sign(
        { userId, type: 'resetPassword' },
        process.env.JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );

      const result = await resetPassword(invalidPassword, token);

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

      const result = await resetPassword(validPassword, invalidToken);

      expect(result).toBe(false);
      expect(mockCookiesSet.set).not.toHaveBeenCalled();
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
    });
  });
});
