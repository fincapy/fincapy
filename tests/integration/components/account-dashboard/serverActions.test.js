import {
  addEmailAddress,
  verifyEmailAddress,
  resendEmailVerification,
  setPrimaryEmail,
  removeEmail,
  changeUserName,
} from '@/components/account-dashboard/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { User } from '@/backend/domain/user';
import { Session } from '@/backend/domain/session';
import { z } from 'zod';
import { redirect } from 'next/navigation';

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

function hashEmail(email) {
  return crypto.createHash('sha256').update(email).digest('hex');
}

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

describe('Account Dashboard Server Actions', () => {
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

  describe('addEmailAddress', () => {
    it('should successfully add a new email address', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
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

      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(true);
    });

    it('should fail with no session', async () => {
      const result = await addEmailAddress('test@test.com');
      expect(redirect).toHaveBeenCalledWith('/signin');
    });

    it('should fail with invalid email address', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
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

      const result = await addEmailAddress('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should fail with no high-risk action token', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validTotpCookieResolution);

      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');
      expect(console.log).toHaveBeenCalledWith('Invalid auth token');
    });
  });

  describe('verifyEmailAddress', () => {
    it('should successfully verify an email address', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: false,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Add verification code
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({ redisAdapter });
      const verificationCode = 123456;
      const verificationKey = `${userId}:${hashEmail(secondaryEmail)}`;
      await emailVerificationCodeRepository.set({
        userId: verificationKey,
        emailVerificationCode: verificationCode,
        ttl: 60 * 15, // 15 minutes
      });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      // ACT
      const result = await verifyEmailAddress(
        secondaryEmail,
        verificationCode.toString()
      );

      // ASSERT
      expect(result.error).toBeUndefined();
      expect(result.success).toBe(true);

      const updatedUser = await userRepository.get({ userId });
      const emailEntry = updatedUser.emails.find(
        (e) => e.email === secondaryEmail
      );
      expect(emailEntry?.verified).toBe(true);

      const deletedCode = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });
      expect(deletedCode).toBeNull();
    });

    it('should fail with no session', async () => {
      const result = await verifyEmailAddress('test@test.com', '123456');
      expect(redirect).toHaveBeenCalledWith('/signin');
    });

    it('should fail with invalid email address', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: false,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Add verification code
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({ redisAdapter });
      const verificationCode = 123456;
      const verificationKey = `${userId}:${hashEmail(secondaryEmail)}`;
      await emailVerificationCodeRepository.set({
        userId: verificationKey,
        emailVerificationCode: verificationCode,
        ttl: 60 * 15, // 15 minutes
      });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      // ACT
      const result = await verifyEmailAddress(
        'invalid-email',
        verificationCode.toString()
      );

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should fail with invalid verification code', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: false,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Add verification code
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({ redisAdapter });
      const verificationCode = 123456;
      const verificationKey = `${userId}:${hashEmail(secondaryEmail)}`;
      await emailVerificationCodeRepository.set({
        userId: verificationKey,
        emailVerificationCode: verificationCode,
        ttl: 60 * 15, // 15 minutes
      });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      // ACT
      const result = await verifyEmailAddress(secondaryEmail, '968753');

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
    });
  });

  describe('resendEmailVerification', () => {
    it('should successfully resend verification code for unverified email', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: false,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up email verification repository
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({ redisAdapter });
      const verificationKey = `${userId}:${hashEmail(secondaryEmail)}`;

      // Delete any existing code to ensure clean test
      await emailVerificationCodeRepository.delete({ userId: verificationKey });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      // ACT
      const result = await resendEmailVerification(secondaryEmail);

      // ASSERT
      expect(result.success).toBe(true);

      const newCode = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });
      expect(newCode).toBeDefined();
      expect(typeof newCode).toBe('number');
      expect(newCode.toString().length).toBe(6);

      if (process.env.NODE_ENV !== 'production') {
        expect(console.log).toHaveBeenCalledWith(
          'Email verification code for resend:',
          expect.any(Number)
        );
      }
    });

    it('should fail with no session', async () => {
      const userId = uuidv4();
      const secondaryEmail = `${userId}-secondary@test.com`;
      const result = await resendEmailVerification(secondaryEmail);
      expect(redirect).toHaveBeenCalledWith('/signin');
    });

    it('should fail with invalid email address', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: false,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up email verification repository
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({ redisAdapter });
      const verificationKey = `${userId}:${hashEmail(secondaryEmail)}`;

      // Delete any existing code to ensure clean test
      await emailVerificationCodeRepository.delete({ userId: verificationKey });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);
      const result = await resendEmailVerification('invalid-email');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });
  });

  describe('setPrimaryEmail', () => {
    it('should succeed with valid high-risk action token', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: true,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up session
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

      // Mock cookies
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

      // ACT
      const result = await setPrimaryEmail('invalid-email');

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
    });

    it('should fail with invalid email address', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: true,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up session
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

      // Mock cookies
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

      // ACT
      const result = await setPrimaryEmail(secondaryEmail);

      // ASSERT
      expect(result.success).toBe(true);

      const updatedUser = await userRepository.get({ userId });
      const newPrimary = updatedUser.emails.find(
        (e) => e.email === secondaryEmail
      );
      const oldPrimary = updatedUser.emails.find((e) => e.email === testEmail);
      expect(newPrimary?.primary).toBe(true);
      expect(oldPrimary?.primary).toBe(false);
    });

    it('should fail with no session', async () => {
      const userId = uuidv4();
      const secondaryEmail = `${userId}-secondary@test.com`;
      const result = await setPrimaryEmail(secondaryEmail);
      expect(redirect).toHaveBeenCalledWith('/signin');
    });

    it('should fail with no high-risk action token', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: true,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      const result = await setPrimaryEmail(secondaryEmail);
      expect(result.success).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Invalid auth token');
      expect(result.error).toBe('Unauthenticated');
    });
  });

  describe('removeEmail', () => {
    it('should succeed removing a non-primary email with valid high-risk action token', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: true,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up session
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

      // Mock cookies
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

      // ACT
      const result = await removeEmail(secondaryEmail);

      // ASSERT
      expect(result.success).toBe(true);

      const updatedUser = await userRepository.get({ userId });
      const hasEmail = updatedUser.emails.some(
        (e) => e.email === secondaryEmail
      );
      expect(hasEmail).toBe(false);
      const hasPrimary = updatedUser.emails.some(
        (e) => e.email === testEmail && e.primary
      );
      expect(hasPrimary).toBe(true);
    });

    it('should fail with no session', async () => {
      const userId = uuidv4();
      const secondaryEmail = `${userId}-secondary@test.com`;
      const result = await removeEmail(secondaryEmail);
      expect(redirect).toHaveBeenCalledWith('/signin');
    });

    it('should fail with no high-risk action token', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: true,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      // ACT
      const result = await removeEmail(secondaryEmail);

      // ASSERT
      expect(result.success).toBe(false);
      expect(console.log).toHaveBeenCalledWith('Invalid auth token');
      expect(result.error).toBe('Unauthenticated');
    });

    it('should fail with invalid email address', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const secondaryEmail = `${userId}-secondary@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Add secondary email to user
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.emails.push({
        email: secondaryEmail,
        verified: true,
        primary: false,
      });
      await userRepository.set({ userId, user });

      // Set up session
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

      // Mock cookies
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

      // ACT
      const result = await removeEmail('invalid-email');

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email address');
      expect(console.log).toHaveBeenCalledWith('Invalid email address');
    });
  });

  describe('changeUserName', () => {
    it('should successfully change user name', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      // ACT
      const result = await changeUserName('New Test User');

      // ASSERT
      expect(result.success).toBe(true);

      const userRepository = new UserRepository({ redisAdapter });
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.name).toBe('New Test User');
    });

    it('should fail with no session', async () => {
      const result = await changeUserName('New Test User');
      expect(redirect).toHaveBeenCalledWith('/signin');
    });

    it('should fail with empty name', async () => {
      // ARRANGE
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `${userId}@test.com`;
      const newPassword = 'testPassword123!5%234a';
      const redisAdapter = new RedisAdapter({ redisClient });
      vi.spyOn(redisAdapter, 'set');

      const transactionManager = new TransactionManager();
      const newTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await newTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        name: 'Test User',
        whitelistBilling: true,
        password: newPassword,
      });

      // Set up session
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

      // Mock cookies
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
        }),
        set: vi.fn(),
      };
      cookies.mockResolvedValue(validCookieResolution);

      // ACT
      const result = await changeUserName('');

      // ASSERT
      expect(result.success).toBe(false);
      expect(result.error).toBe('Name cannot be empty');
    });
  });
});
