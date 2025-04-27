import {
  createAccount,
  verifyEmail,
} from '@/components/sign-up-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { Session } from '@/backend/domain/session';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Sign Up Form Server Actions', () => {
  const testName = 'Test User';
  const testPassword = 'TestPassword123!';
  const testAccessCode = 'test-access-code';
  let consoleLogSpy;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env.NEXT_PUBLIC_SITE_ACCESS_CODE = testAccessCode;
    process.env.NODE_ENV = 'development';
    consoleLogSpy = vi.spyOn(console, 'log');

    // Mock headers to return test IP
    headers.mockReturnValue({ get: vi.fn(() => crypto.randomUUID()) });

    // Mock cookies to return empty initially
    cookies.mockReturnValue({
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    });
  });

  describe('createAccount', () => {
    it('should successfully create an account with valid inputs', async () => {
      const result = await createAccount(
        testName,
        `${uuidv4()}@test.com`,
        testPassword,
        testAccessCode
      );

      expect(cookies().set).toHaveBeenCalledWith(
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
      expect(redirect).toHaveBeenCalledWith('/verify-email');
    });

    it('should fail with invalid access code in production', async () => {
      process.env.NODE_ENV = 'production';

      const result = await createAccount(
        testName,
        `${uuidv4()}@test.com`,
        testPassword,
        'wrong-code'
      );

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'ACCESS_CODE_ERROR: Invalid access code provided'
      );
      expect(cookies().set).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should fail with invalid email format', async () => {
      const result = await createAccount(
        testName,
        'invalid-email',
        testPassword,
        testAccessCode
      );

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'VALIDATION_ERROR: Invalid input data'
      );
      expect(cookies().set).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should fail with weak password', async () => {
      const result = await createAccount(
        testName,
        `${uuidv4()}@test.com`,
        'weak1234', // Has lowercase and numbers but only 2 character types
        testAccessCode
      );

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'VALIDATION_ERROR: Invalid input data'
      );
      expect(cookies().set).not.toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
    });

    it('should accept password with exactly 3 character types', async () => {
      const result = await createAccount(
        testName,
        `${uuidv4()}@test.com`,
        'Password123', // Has uppercase, lowercase, and numbers (3 types)
        testAccessCode
      );

      expect(cookies().set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedToken',
        expect.any(String),
        expect.any(Object)
      );
      expect(redirect).toHaveBeenCalledWith('/verify-email');
    });

    it('should accept password with all 4 character types', async () => {
      const result = await createAccount(
        testName,
        `${uuidv4()}@test.com`,
        'Password123!', // Has all 4 character types
        testAccessCode
      );

      expect(cookies().set).toHaveBeenCalledWith(
        'emailPasswordAuthenticatedToken',
        expect.any(String),
        expect.any(Object)
      );
      expect(redirect).toHaveBeenCalledWith('/verify-email');
    });
  });
});
