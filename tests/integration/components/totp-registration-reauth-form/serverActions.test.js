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
import { Session } from '@/backend/domain/session';
import { generateBackupCodes } from '@/utils/backupCodes';

const userId = uuidv4();
const tenantId = uuidv4();
const secret = speakeasy.generateSecret();

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

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
      const userId = uuidv4();
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });
      const userRepository = new UserRepository({ redisAdapter });
      const backupCodes = await generateBackupCodes();
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [backupCodes.hashedCodes[0]],
        },
      });

      // Mock cookies with valid session and backup code
      const validBackupCodeCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'highRiskActionValidatedToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'highRiskActionValidated',
                },
                process.env.JWT_SECRET,
                { expiresIn: '5m', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      cookies.mockResolvedValue(validBackupCodeCookieResolution);

      const newSecret = speakeasy.generateSecret().base32;
      const token = speakeasy.totp({
        secret: newSecret,
        encoding: 'base32',
      });

      const result = await verifyAndSaveTOTP(token, newSecret);

      expect(result.error).toBeUndefined();
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
      const userId = uuidv4();
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });
      const userRepository = new UserRepository({ redisAdapter });
      const backupCodes = await generateBackupCodes();
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [backupCodes.hashedCodes[0]],
        },
      });

      // Mock cookies with valid session and backup code
      const validBackupCodeCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'highRiskActionValidatedToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'highRiskActionValidated',
                },
                process.env.JWT_SECRET,
                { expiresIn: '5m', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      cookies.mockResolvedValue(validBackupCodeCookieResolution);

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
      const userId = uuidv4();
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });
      const userRepository = new UserRepository({ redisAdapter });
      const backupCodes = await generateBackupCodes();
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [backupCodes.hashedCodes[0]],
        },
      });

      // Mock cookies with valid session and backup code
      const validBackupCodeCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      cookies.mockResolvedValue(validBackupCodeCookieResolution);

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
      const userId = uuidv4();
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });
      const userRepository = new UserRepository({ redisAdapter });
      const backupCodes = await generateBackupCodes();
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [backupCodes.hashedCodes[0]],
        },
      });

      // Mock cookies with valid session and backup code
      const validBackupCodeCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'highRiskActionValidatedToken') {
            return {
              value: jwt.sign(
                { userId, tenantId, type: 'highRiskActionValidated' },
                'wrong-secret',
                { expiresIn: '3h', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      cookies.mockResolvedValue(validBackupCodeCookieResolution);

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
      const userId = uuidv4();
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });
      const userRepository = new UserRepository({ redisAdapter });
      const backupCodes = await generateBackupCodes();
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [backupCodes.hashedCodes[0]],
        },
      });

      // Mock cookies with valid session and backup code
      const validBackupCodeCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'highRiskActionValidatedToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'wrong',
                },
                process.env.JWT_SECRET,
                { expiresIn: '5m', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      cookies.mockResolvedValue(validBackupCodeCookieResolution);

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
      const userId = uuidv4();
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });
      // Mock cookies with valid session and backup code
      const validBackupCodeCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'highRiskActionValidatedToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'highRiskActionValidated',
                },
                process.env.JWT_SECRET,
                { expiresIn: '5m', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      cookies.mockResolvedValue(validBackupCodeCookieResolution);

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
      const userId = uuidv4();
      const redisAdapter = new RedisAdapter({ redisClient });
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: new Date(),
        lastRotated: new Date(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });
      const userRepository = new UserRepository({ redisAdapter });
      const backupCodes = await generateBackupCodes();
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [backupCodes.hashedCodes[0]],
        },
      });

      // Mock cookies with valid session and backup code
      const validBackupCodeCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'highRiskActionValidatedToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'highRiskActionValidated',
                },
                process.env.JWT_SECRET,
                { expiresIn: '5m', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      cookies.mockResolvedValue(validBackupCodeCookieResolution);

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
