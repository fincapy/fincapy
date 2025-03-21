import {
  generateTOTPSecret,
  verifyAndSaveTOTP,
} from '@/components/totp-registration-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { Session } from '@/backend/domain/session';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { cookies, headers } from 'next/headers';
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
const tenantId = uuidv4();

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

const validEmailPasswordAuthToken = jwt.sign(
  { userId, tenantId, type: 'emailPasswordAuthenticated' },
  process.env.JWT_SECRET,
  { expiresIn: '3h', algorithm: 'HS256' }
);

const validCookieResolution = {
  get: vi.fn((key) => {
    if (key === 'emailPasswordAuthenticatedToken') {
      return { value: validEmailPasswordAuthToken };
    }
    return undefined;
  }),
  set: vi.fn(),
  delete: vi.fn(),
};

const invalidCookieResolution = {
  get: vi.fn(() => undefined),
  set: vi.fn(),
  delete: vi.fn(),
};

describe('TOTP Registration Form Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    headers.mockReturnValue({ get: vi.fn(() => crypto.randomUUID()) });
    vi.spyOn(console, 'log');
  });

  describe('generateTOTPSecret', () => {
    it('should successfully generate a TOTP secret', async () => {
      const result = await generateTOTPSecret();

      expect(result.success).toBe(true);
      expect(result.otpauthUrl).toBeDefined();
      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toContain('Fincapy');
    });
  });

  describe('verifyAndSaveTOTP', () => {
    let userRepository;
    let redisAdapter;

    beforeAll(async () => {
      redisAdapter = new RedisAdapter({ redisClient });
      userRepository = new UserRepository({ redisAdapter });

      // Create a test user
      await userRepository.set({
        userId,
        user: {
          id: userId,
          role: 'owner',
          totpEnabled: false,
          backupCodes: [],
        },
      });
    });

    it('should successfully verify and save TOTP setup', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const secret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, secret);

      expect(result.success).toBe(true);
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes.length).toBe(5);

      // Verify user was updated
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.totpEnabled).toBe(true);
      expect(updatedUser.totpSecret).toBe(secret);
      expect(updatedUser.backupCodes).toBeDefined();
      expect(updatedUser.backupCodes.length).toBe(5);
    });

    it('should fail with invalid token', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const secret = speakeasy.generateSecret().base32;
      const result = await verifyAndSaveTOTP('123456', secret);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
      expect(console.log).toHaveBeenCalledWith(
        'Invalid TOTP verification code provided'
      );
    });

    it('should fail with missing authentication', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const secret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, secret);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Missing email password authentication token'
      );
    });

    it('should fail with invalid input', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const result = await verifyAndSaveTOTP('12', 'invalid-secret');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
      expect(console.log).toHaveBeenCalledWith(
        'Invalid input provided for TOTP registration'
      );
    });

    it('should fail with rate limit', async () => {
      cookies.mockResolvedValue(validCookieResolution);
      // Set a consistent IP for rate limit testing
      headers.mockReturnValue({ get: vi.fn(() => '127.0.0.1') });

      const secret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: secret,
        encoding: 'base32',
      });
      for (let i = 0; i < 10; i++) {
        await verifyAndSaveTOTP('123456', '123456789101212131415');
      }

      const result = await verifyAndSaveTOTP(token, secret);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Too many attempts, please try again later');
      expect(console.log).toHaveBeenCalledWith(
        'IP rate limit exceeded for TOTP registration'
      );
    });
  });
});
