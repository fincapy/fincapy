import {
  resendEmailVerificationCode,
  verifyEmail,
} from '@/components/email-verification-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

const userId = uuidv4();
const userIdRateLimited = uuidv4();
const tenantId = uuidv4();

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

const validEmailPasswordToken = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { userId, tenantId, type: 'emailPasswordAuthenticated' },
      process.env.JWT_SECRET,
      { expiresIn: '10m', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const validEmailPasswordTokenUserRateLimited = {
  get: vi.fn(() => ({
    value: jwt.sign(
      {
        userId: userIdRateLimited,
        tenantId,
        type: 'emailPasswordAuthenticated',
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const validEmailPasswordTokenMissingUser = {
  get: vi.fn(() => ({
    value: jwt.sign(
      {
        userId: crypto.randomUUID(),
        tenantId,
        type: 'emailPasswordAuthenticated',
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const invalidEmailPasswordToken = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { userId: 'invalid-user', type: 'emailPasswordAuthenticated' },
      process.env.JWT_SECRET,
      { expiresIn: '10m', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const missingEmailPasswordToken = {
  get: vi.fn(() => undefined),
  set: vi.fn(),
  delete: vi.fn(),
};

describe('Email Verification Form Server Actions', () => {
  let consoleLogSpy;

  beforeAll(async () => {
    // Set up test user
    const redisAdapter = new RedisAdapter({ redisClient });
    const userRepository = new UserRepository({ redisAdapter });
    await userRepository.set({
      userId,
      user: {
        id: userId,
        tenantId,
        emails: [
          {
            email: 'test@example.com',
            primary: true,
            verified: false,
          },
        ],
        totpEnabled: false,
      },
    });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    headers.mockReturnValue({
      get: vi.fn(() => crypto.randomUUID()),
    });
    consoleLogSpy = vi.spyOn(console, 'log');
  });

  afterEach(async () => {
    const redisAdapter = new RedisAdapter({ redisClient });
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
      }
    );
    await emailVerificationCodeRepository.delete({ userId });
    consoleLogSpy.mockRestore();
  });

  describe('resendEmailVerificationCode', () => {
    it('should successfully resend verification code', async () => {
      cookies.mockResolvedValue(validEmailPasswordToken);

      const result = await resendEmailVerificationCode();
      expect(result).toBe(true);

      // Verify that a code was stored
      const redisAdapter = new RedisAdapter({ redisClient });
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({
          redisAdapter,
        });
      const code = await emailVerificationCodeRepository.get({ userId });
      expect(code).toBeDefined();
      expect(typeof code).toBe('number');
      expect(code.toString()).toHaveLength(6);
    });

    it('should return false when no token exists', async () => {
      cookies.mockResolvedValue(missingEmailPasswordToken);

      const result = await resendEmailVerificationCode();
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'No email password authentication token found'
      );
    });

    it('should return false for invalid token', async () => {
      cookies.mockResolvedValue(validEmailPasswordTokenMissingUser);

      const result = await resendEmailVerificationCode();
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('User not found');
    });

    it('should fail with IP rate limit', async () => {
      cookies.mockResolvedValue(validEmailPasswordTokenMissingUser);
      headers.mockReturnValue({
        get: vi.fn(() => '127.0.0.1'),
      });
      for (let i = 0; i < 10; i++) {
        await resendEmailVerificationCode();
      }

      const result = await resendEmailVerificationCode();
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('IP Rate limit exceeded');
    });

    it('should fail with user rate limit', async () => {
      cookies.mockResolvedValue(validEmailPasswordTokenUserRateLimited);
      const ipMock = vi.fn();
      headers.mockReturnValue({
        get: ipMock,
      });
      for (let i = 0; i < 10; i++) {
        ipMock.mockReturnValueOnce(crypto.randomUUID());
        await resendEmailVerificationCode();
      }

      const result = await resendEmailVerificationCode();
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('User Rate limit exceeded');
    });
  });

  describe('verifyEmail', () => {
    it('should successfully verify email with correct code', async () => {
      cookies.mockResolvedValue(validEmailPasswordToken);

      // First request a code
      await resendEmailVerificationCode();

      // Get the code from Redis
      const redisAdapter = new RedisAdapter({ redisClient });
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({
          redisAdapter,
        });
      const code = await emailVerificationCodeRepository.get({ userId });

      // Verify the email
      const result = await verifyEmail(code.toString());

      // Check that the user's email is marked as verified
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      expect(user.emails[0].verified).toBe(true);
      expect(validEmailPasswordToken.set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: false, // false in development
          sameSite: 'strict',
          maxAge: 60 * 10 * 1000, // 10 minutes
        }
      );
      expect(redirect).toHaveBeenCalledWith('/register-totp');
    });

    it('should return false for incorrect verification code', async () => {
      cookies.mockResolvedValue(validEmailPasswordToken);
      await resendEmailVerificationCode();

      const result = await verifyEmail('123456');
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Invalid verification code provided'
      );
    });

    it('should return false for invalid code format', async () => {
      cookies.mockResolvedValue(validEmailPasswordToken);

      const result = await verifyEmail('12345'); // 5 digits instead of 6
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Verification code validation failed:',
        expect.any(Object)
      );
    });

    it('should return false when no token exists', async () => {
      cookies.mockResolvedValue(missingEmailPasswordToken);

      const result = await verifyEmail('123456');
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'No email password authentication token found for verification'
      );
    });

    it('should fail with rate limit', async () => {
      cookies.mockResolvedValue(validEmailPasswordToken);
      headers.mockReturnValue({
        get: vi.fn(() => '127.0.0.1'),
      });
      for (let i = 0; i < 10; i++) {
        await verifyEmail(crypto.randomUUID());
      }

      const result = await verifyEmail(crypto.randomUUID());
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('IP Rate limit exceeded');
    });

    it('should fail with user rate limit', async () => {
      cookies.mockResolvedValue(validEmailPasswordTokenUserRateLimited);
      const ipMock = vi.fn();
      headers.mockReturnValue({
        get: ipMock,
      });
      for (let i = 0; i < 10; i++) {
        ipMock.mockReturnValueOnce(crypto.randomUUID());
        await verifyEmail(crypto.randomUUID());
      }

      const result = await verifyEmail(crypto.randomUUID());
      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith('User Rate limit exceeded');
    });
  });
});
