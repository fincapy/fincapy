import { verifyTOTP } from '@/components/totp-verification-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { generateBackupCodes } from '@/utils/backupCodes';
import speakeasy from 'speakeasy';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

const userId = uuidv4();
const secret = speakeasy.generateSecret();

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

const validCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { userId, type: 'emailPasswordAuthenticated' },
      process.env.JWT_SECRET,
      {
        expiresIn: '5m',
        algorithm: 'HS256',
      }
    ),
  })),
  set: vi.fn(),
};

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

const backupCodes = await generateBackupCodes();
const hashedBackupCode = backupCodes.hashedCodes[0];
const backupCode = backupCodes.codes[0];

const mockHeaders = new Map();
mockHeaders.set('fly-client-ip', '127.0.0.1');

describe('TOTP Verification Form Server Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    cookies.mockReturnValue(validCookieResolution);
    headers.mockReturnValue(mockHeaders);

    // Setup test user with TOTP secret
    const redisAdapter = new RedisAdapter({ redisClient });
    const userRepository = new UserRepository({ redisAdapter });
    const backupCodes = await generateBackupCodes();
    await userRepository.set({
      userId,
      user: {
        id: userId,
        role: 'owner',
        totpEnabled: true,
        totpSecret: secret.base32,
        backupCodes: [hashedBackupCode],
      },
    });
  });

  describe('verifyTOTP', () => {
    it('should successfully verify valid TOTP token', async () => {
      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      });

      const result = await verifyTOTP(token);
      expect(redirect).toHaveBeenCalledWith('/app');
    });

    it('should successfully verify valid backup code', async () => {
      const result = await verifyTOTP(backupCode, true);
      expect(redirect).toHaveBeenCalledWith('/app');
    });

    it('should fail with invalid TOTP token', async () => {
      const result = await verifyTOTP('123456');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with invalid backup code', async () => {
      const result = await verifyTOTP('INVALID123456', true);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail with missing authentication token', async () => {
      cookies.mockReturnValue({
        get: () => null,
        set: vi.fn(),
      });

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      });

      const result = await verifyTOTP(token);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication token missing');
    });

    it('should fail with invalid token type', async () => {
      cookies.mockReturnValue({
        get: vi.fn(() => ({
          value: jwt.sign(
            { userId, type: 'wrongType' },
            process.env.JWT_SECRET,
            {
              expiresIn: '5m',
              algorithm: 'HS256',
            }
          ),
        })),
        set: vi.fn(),
      });

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      });

      const result = await verifyTOTP(token);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token type');
    });
  });
});
