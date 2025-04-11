import { verifyTOTPForHighRiskAction } from '@/components/totp-verification-reauth-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { cookies, headers } from 'next/headers';
import { generateBackupCodes } from '@/utils/backupCodes';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
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

const sessionId = uuidv4();
const userId = uuidv4();
const userIdRateLimited = uuidv4();
const userIdWithoutTOTP = uuidv4();
const tenantId = uuidv4();
const secret = speakeasy.generateSecret();

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

describe('TOTP Verification Reauth Form Server Actions', () => {
  beforeEach(async () => {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
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
    vi.clearAllMocks();
    headers.mockReturnValue({ get: vi.fn(() => crypto.randomUUID()) });
    vi.spyOn(console, 'log');

    // Setup test user with TOTP secret
    const userRepository = new UserRepository({ redisAdapter });
    const backupCodes = await generateBackupCodes();
    const hashedBackupCode = backupCodes.hashedCodes[0];

    await userRepository.set({
      userId,
      user: {
        id: userId,
        tenantId,
        role: 'owner',
        totpEnabled: true,
        totpSecret: secret.base32,
        backupCodes: [hashedBackupCode],
      },
    });

    await userRepository.set({
      userId: userIdRateLimited,
      user: {
        id: userIdRateLimited,
        tenantId,
        role: 'owner',
        totpEnabled: true,
        totpSecret: secret.base32,
        backupCodes: [hashedBackupCode],
      },
    });

    await userRepository.set({
      userId: userIdWithoutTOTP,
      user: {
        id: userIdWithoutTOTP,
        tenantId,
        role: 'owner',
        totpEnabled: false,
      },
    });

    // Reset default cookie mock
    cookies.mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
    });
  });

  describe('verifyTOTPForHighRiskAction', () => {
    it('should successfully verify valid TOTP token with active session', async () => {
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

      // Generate valid TOTP token
      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      });

      // Mock cookies with valid session and TOTP token
      const validTotpCookieResolution = {
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
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'emailPasswordAuthenticatedHighRiskAction',
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

      cookies.mockResolvedValue(validTotpCookieResolution);

      const result = await verifyTOTPForHighRiskAction(token);

      expect(result).toBe(true);
      expect(validTotpCookieResolution.set).toHaveBeenCalledWith(
        'highRiskActionValidatedToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 5 * 1000, // 5 minutes
        }
      );

      // Verify the token structure
      const highRiskActionToken =
        validTotpCookieResolution.set.mock.calls[0][1];
      const decoded = jwt.verify(highRiskActionToken, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        userId,
        tenantId,
        type: 'highRiskActionValidated',
      });
      expect(decoded.jti).toBeDefined();
    });

    it('should successfully verify valid backup code with active session', async () => {
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
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'emailPasswordAuthenticatedHighRiskAction',
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

      const result = await verifyTOTPForHighRiskAction(
        backupCodes.codes[0],
        true
      );

      expect(result).toBe(true);
      expect(validBackupCodeCookieResolution.set).toHaveBeenCalledWith(
        'highRiskActionValidatedToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 5 * 1000, // 5 minutes
        }
      );

      // Verify backup code is marked as used
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.backupCodes[0].used).toBe(true);
    });

    it('should fail with no active session', async () => {
      // Mock no active session
      const noSessionCookieResolution = {
        get: vi.fn((name) => {
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };

      cookies.mockResolvedValue(noSessionCookieResolution);

      const result = await verifyTOTPForHighRiskAction();

      expect(result).toBe(false);
      expect(noSessionCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('No active session found');
    });

    it('should fail when no token cookie is present', async () => {
      // Mock session with no TOTP token
      const noTokenCookieResolution = {
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

      cookies.mockResolvedValue(noTokenCookieResolution);

      const result = await verifyTOTPForHighRiskAction();

      expect(result).toBe(false);
      expect(noTokenCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('No token found');
    });

    it('should fail with invalid JWT token', async () => {
      // Mock session with invalid token
      const invalidTokenCookieResolution = {
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
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return { value: 'invalid-token' };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };

      cookies.mockResolvedValue(invalidTokenCookieResolution);

      const result = await verifyTOTPForHighRiskAction();

      expect(result).toBe(false);
      expect(invalidTokenCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Invalid token');
    });

    it('should fail with wrong token type', async () => {
      // Create JWT token with wrong type
      const jwtToken = jwt.sign(
        {
          userId,
          tenantId,
          type: 'wrongType',
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      // Mock session with wrong token type
      const wrongTypeTokenCookieResolution = {
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
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return { value: jwtToken };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };

      cookies.mockResolvedValue(wrongTypeTokenCookieResolution);

      const result = await verifyTOTPForHighRiskAction();

      expect(result).toBe(false);
      expect(wrongTypeTokenCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Invalid token type');
    });

    it('should fail when user has no backup codes available', async () => {
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
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [],
        },
      });

      // Create JWT token
      const jwtToken = jwt.sign(
        {
          userId,
          tenantId,
          type: 'emailPasswordAuthenticatedHighRiskAction',
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      // Mock session for backup code attempt with no codes
      const noBackupCodeUserCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                {
                  sessionId: sessionId,
                  userId: userId,
                  type: 'session',
                },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return { value: jwtToken };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };

      cookies.mockResolvedValue(noBackupCodeUserCookieResolution);

      const result = await verifyTOTPForHighRiskAction('123456', true);

      expect(result).toBe(false);
      // expect(noBackupCodeUserCookieResolution.set).toBeCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        'TOTP invalid backup code for user'
      );
    });

    it('should fail with invalid TOTP token', async () => {
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
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [],
        },
      });

      // Mock session with invalid TOTP token
      const invalidTotpTokenCookieResolution = {
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
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'emailPasswordAuthenticatedHighRiskAction',
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

      cookies.mockResolvedValue(invalidTotpTokenCookieResolution);
      const result = await verifyTOTPForHighRiskAction('123456');

      expect(result).toBe(false);
      expect(invalidTotpTokenCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'TOTP invalid verification code for user'
      );
    });

    it('should fail with invalid backup code', async () => {
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
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [],
        },
      });

      // Mock session with invalid backup code
      const invalidBackupCodeCookieResolution = {
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
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return {
              value: jwt.sign(
                {
                  userId: userId,
                  tenantId: tenantId,
                  type: 'emailPasswordAuthenticatedHighRiskAction',
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

      cookies.mockResolvedValue(invalidBackupCodeCookieResolution);

      const result = await verifyTOTPForHighRiskAction(true);

      expect(result).toBe(false);
      expect(invalidBackupCodeCookieResolution.set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'TOTP invalid verification code for user'
      );
    });

    it('should respect user rate limiting', async () => {
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
      await userRepository.set({
        userId,
        user: {
          id: userId,
          tenantId,
          role: 'owner',
          totpEnabled: true,
          totpSecret: secret.base32,
          backupCodes: [],
        },
      });

      // Mock session for rate limited user
      const rateLimitedUserCookieResolution = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                {
                  sessionId: sessionId,
                  userId: userId,
                  type: 'session',
                },
                process.env.JWT_SECRET,
                {
                  expiresIn: '3h',
                  algorithm: 'HS256',
                }
              ),
            };
          }
          if (name === 'emailPasswordAuthenticatedHighRiskActionToken') {
            return { value: '123456' };
          }
          return null;
        }),
        set: vi.fn(),
        delete: vi.fn(),
      };

      cookies.mockResolvedValue(rateLimitedUserCookieResolution);

      for (let i = 0; i < 10; i++) {
        await verifyTOTPForHighRiskAction();
      }

      const result = await verifyTOTPForHighRiskAction();
      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('User Rate limit exceeded');
    });
  });
});
