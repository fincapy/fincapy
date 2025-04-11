import { updatePassword } from '@/components/account-set-password-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { Session } from '@/backend/domain/session';
import bcrypt from 'bcryptjs';
import { cookies, headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { User } from '@/backend/domain/user';
import { z } from 'zod';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

describe('Account Set Password Form Server Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    headers.mockReturnValue({ get: vi.fn(() => crypto.randomUUID()) });
    vi.spyOn(console, 'log');
    cookies.mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update password', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const testEmail = `${userId}@test.com`;
    const newPassword = 'testPassword123!5%234a';
    const redisAdapter = new RedisAdapter({ redisClient });
    const user = new User({
      id: userId,
      tenantId,
      name: 'Test User',
      emails: [{ email: testEmail, verified: true, primary: true }],
      role: 'owner',
      password: 'bibbitybobbity',
      mfaMethod: 'email',
      totpSecret: null,
      totpVerified: false,
    });
    const userRepository = new UserRepository({ redisAdapter });
    await userRepository.set({
      userId,
      user,
    });
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
        if (name === 'highRiskActionValidatedToken') {
          return {
            value: jwt.sign(
              {
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId,
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(validTotpCookieResolution);

    // ACT
    const result = await updatePassword(newPassword);

    // ASSERT
    expect(result.success).toBe(true);

    // Verify user was updated with new password
    const updatedUser = await userRepository.get({ userId });
    expect(updatedUser.password).not.toBe('bibbitybobbity');
    // Check that bcrypt can validate the new password
    const isPasswordValid = await bcrypt.compare(
      newPassword,
      updatedUser.password
    );
    expect(isPasswordValid).toBe(true);
  });

  it('should fail when no active session is found', async () => {
    // ARRANGE
    const newPassword = 'testPassword123!5%234a';
    // Mock cookies to return empty values to simulate no session
    const missingSessionCookieResolution = {
      get: vi.fn(() => undefined),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(missingSessionCookieResolution);

    // ACT
    const result = await updatePassword(newPassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthenticated');
    expect(console.log).toHaveBeenCalledWith(
      'No active session found in updatePassword'
    );
  });

  it('should fail when password is too short', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const sessionId = uuidv4();
    const shortPassword = 'Abc1!';

    // Create session
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
      ttl: 60 * 60 * 3,
    });

    // Mock cookies
    const cookieResolution = {
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
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId,
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(cookieResolution);

    // ACT
    const result = await updatePassword(shortPassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe('Password must be at least 8 characters long');
  });

  it('should fail when password is missing uppercase letter', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const sessionId = uuidv4();
    const noUppercasePassword = 'password123!';

    // Create session
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
      ttl: 60 * 60 * 3,
    });

    // Mock cookies
    const cookieResolution = {
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
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId,
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(cookieResolution);

    // ACT
    const result = await updatePassword(noUppercasePassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe(
      'Password must contain at least one uppercase letter'
    );
  });

  it('should fail when password is missing lowercase letter', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const sessionId = uuidv4();
    const noLowercasePassword = 'PASSWORD123!';

    // Create session
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
      ttl: 60 * 60 * 3,
    });

    // Mock cookies
    const cookieResolution = {
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
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId,
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(cookieResolution);

    // ACT
    const result = await updatePassword(noLowercasePassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe(
      'Password must contain at least one lowercase letter'
    );
  });

  it('should fail when password is missing number', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const sessionId = uuidv4();
    const noNumberPassword = 'Password!';

    // Create session
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
      ttl: 60 * 60 * 3,
    });

    // Mock cookies
    const cookieResolution = {
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
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId,
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(cookieResolution);

    // ACT
    const result = await updatePassword(noNumberPassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe('Password must contain at least one number');
  });

  it('should fail when password is missing special character', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const sessionId = uuidv4();
    const noSpecialCharPassword = 'Password123';

    // Create session
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
      ttl: 60 * 60 * 3,
    });

    // Mock cookies
    const cookieResolution = {
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
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId,
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(cookieResolution);

    // ACT
    const result = await updatePassword(noSpecialCharPassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe(
      'Password must contain at least one special character'
    );
  });

  it('should fail when high-risk action token is missing', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const testEmail = `${userId}@test.com`;
    const newPassword = 'testPassword123!5%234a';
    const redisAdapter = new RedisAdapter({ redisClient });
    const user = new User({
      id: userId,
      tenantId,
      name: 'Test User',
      emails: [{ email: testEmail, verified: true, primary: true }],
      role: 'owner',
      password: 'bibbitybobbity',
      mfaMethod: 'email',
      totpSecret: null,
      totpVerified: false,
    });
    const userRepository = new UserRepository({ redisAdapter });
    await userRepository.set({
      userId,
      user,
    });
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

    // Mock cookies without highRiskActionValidatedToken
    const missingTokenCookieResolution = {
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
        // No highRiskActionValidatedToken
        return undefined;
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(missingTokenCookieResolution);

    // ACT
    const result = await updatePassword(newPassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthenticated');
    expect(result.tokenInvalid).toBe(true);
  });

  it('should fail when high-risk action token has different userId', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const differentUserId = uuidv4();
    const testEmail = `${userId}@test.com`;
    const newPassword = 'testPassword123!5%234a';
    const redisAdapter = new RedisAdapter({ redisClient });
    const user = new User({
      id: userId,
      tenantId,
      name: 'Test User',
      emails: [{ email: testEmail, verified: true, primary: true }],
      role: 'owner',
      password: 'bibbitybobbity',
      mfaMethod: 'email',
      totpSecret: null,
      totpVerified: false,
    });
    const userRepository = new UserRepository({ redisAdapter });
    await userRepository.set({
      userId,
      user,
    });
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

    // Mock cookies with highRiskActionValidatedToken containing different userId
    const differentUserIdCookieResolution = {
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
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId: differentUserId, // Different userId
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(differentUserIdCookieResolution);

    // ACT
    const result = await updatePassword(newPassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthenticated');
    expect(result.tokenInvalid).toBe(true);
  });

  it('should fail when user is not found', async () => {
    // ARRANGE
    const userId = uuidv4();
    const tenantId = uuidv4();
    const newPassword = 'testPassword123!5%234a';
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

    const validCookieResolution = {
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
                type: 'highRiskActionValidated',
                jti: uuidv4(),
                userId,
                tenantId,
              },
              process.env.JWT_SECRET,
              {
                expiresIn: '3h',
                algorithm: 'HS256',
              }
            ),
          };
        }
      }),
      set: vi.fn(),
    };
    cookies.mockResolvedValue(validCookieResolution);

    // Don't create a user in the repository, so it will be null

    // ACT
    const result = await updatePassword(newPassword);

    // ASSERT
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unexpected error');
    expect(console.log).toHaveBeenCalledWith('User not found');
  });
});
