import {
  generateTOTPSecret,
  verifyAndSaveTOTP,
} from '@/components/totp-registration-reauth-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
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
const secret = speakeasy.generateSecret();

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

const validHighRiskActionToken = jwt.sign(
  { userId, tenantId, type: 'highRiskActionValidated' },
  process.env.JWT_SECRET,
  { expiresIn: '3h', algorithm: 'HS256' }
);

const validCookieResolution = {
  get: vi.fn((key) => {
    if (key === 'highRiskActionValidatedToken') {
      return { value: validHighRiskActionToken };
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

describe('TOTP Registration Reauth Form Server Actions', () => {
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
        tenantId,
        role: 'owner',
        totpEnabled: false,
      },
    });
  });

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

    it('should handle errors gracefully', async () => {
      // Mock speakeasy to throw an error
      vi.spyOn(speakeasy, 'generateSecret').mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const result = await generateTOTPSecret();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate authentication secret');
      expect(console.log).toHaveBeenCalledWith('TOTP secret generation failed');
    });
  });

  describe('verifyAndSaveTOTP', () => {
    it('should successfully verify and save TOTP setup', async () => {
      cookies.mockReturnValue(validCookieResolution);

      const newSecret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: newSecret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, newSecret);

      expect(result.success).toBe(true);
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes.length).toBeGreaterThan(0);

      // Verify user was updated
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.totpEnabled).toBe(true);
      expect(updatedUser.totpSecret).toBe(newSecret);
      expect(updatedUser.backupCodes).toBeDefined();
      expect(updatedUser.backupCodes.length).toBeGreaterThan(0);
    });

    it('should fail with invalid token', async () => {
      cookies.mockReturnValue(validCookieResolution);

      const newSecret = speakeasy.generateSecret().base32;
      const invalidToken = '123456'; // Not matching the secret

      const result = await verifyAndSaveTOTP(invalidToken, newSecret);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
      expect(console.log).toHaveBeenCalledWith(
        'Invalid TOTP verification code provided'
      );
    });

    it('should fail with missing high risk action validation token', async () => {
      cookies.mockReturnValue(invalidCookieResolution);

      const newSecret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: newSecret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, newSecret);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
      expect(console.log).toHaveBeenCalledWith(
        'Missing high risk action validated token'
      );
    });

    it('should fail with invalid JWT token', async () => {
      // Mock a cookie with invalid signature
      const invalidSignatureToken = jwt.sign(
        { userId, tenantId, type: 'highRiskActionValidated' },
        'wrong-secret',
        { expiresIn: '3h', algorithm: 'HS256' }
      );

      cookies.mockReturnValue({
        get: vi.fn(() => ({ value: invalidSignatureToken })),
      });

      const newSecret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: newSecret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, newSecret);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid authentication token');
      expect(console.log).toHaveBeenCalledWith(
        'JWT verification failed for TOTP registration'
      );
    });

    it('should fail with wrong token type', async () => {
      // Mock a cookie with wrong token type
      const wrongTypeToken = jwt.sign(
        { userId, tenantId, type: 'wrongType' },
        process.env.JWT_SECRET,
        { expiresIn: '3h', algorithm: 'HS256' }
      );

      cookies.mockReturnValue({
        get: vi.fn(() => ({ value: wrongTypeToken })),
      });

      const newSecret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: newSecret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, newSecret);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token type');
      expect(console.log).toHaveBeenCalledWith(
        'Invalid token type for TOTP registration'
      );
    });

    it('should fail when user not found', async () => {
      // Create a token for a non-existent user
      const nonExistentUserId = uuidv4();
      const nonExistentUserToken = jwt.sign(
        {
          userId: nonExistentUserId,
          tenantId,
          type: 'highRiskActionValidated',
        },
        process.env.JWT_SECRET,
        { expiresIn: '3h', algorithm: 'HS256' }
      );

      cookies.mockReturnValue({
        get: vi.fn(() => ({ value: nonExistentUserToken })),
      });

      const newSecret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: newSecret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, newSecret);

      expect(result.success).toBe(false);
      expect(result.error).toBe('User not found');
      expect(console.log).toHaveBeenCalledWith(
        'User not found during TOTP registration'
      );
    });

    it('should fail with invalid input', async () => {
      cookies.mockReturnValue(validCookieResolution);

      // Test with invalid token length
      const result = await verifyAndSaveTOTP('12', 'invalid-secret');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
      expect(console.log).toHaveBeenCalledWith(
        'Invalid input provided for TOTP registration'
      );
    });
  });
});
