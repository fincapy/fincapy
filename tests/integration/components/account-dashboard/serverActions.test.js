import {
  addEmailAddress,
  verifyEmailAddress,
  resendEmailVerification,
  setPrimaryEmail,
  removeEmail,
} from '@/components/account-dashboard/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { cookies, headers } from 'next/headers';
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

const userId = uuidv4();
const tenantId = uuidv4();
const testEmail = `${userId}@test.com`;
const secondaryEmail = `${userId}-secondary@test.com`;
const testPassword = 'testPassword123!';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('@/backend/adapters/sesAdapter', () => ({
  SESAdapter: vi.fn().mockImplementation(() => ({
    sendEmail: vi.fn().mockResolvedValue(true),
  })),
}));

describe('Account Dashboard Server Actions', () => {
  let userRepository;
  let emailVerificationCodeRepository;
  let redisAdapter;

  beforeAll(async () => {
    // Set up a test user
    redisAdapter = new RedisAdapter({ redisClient });
    const transactionManager = new TransactionManager({
      redisAdapter,
    });
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
    });
    await setupNewTenantService.execute({
      tenantId,
      userId,
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      whitelistBilling: true,
    });

    // Initialize repositories
    userRepository = new UserRepository({ redisAdapter });
    emailVerificationCodeRepository = new EmailVerificationCodeRepository({
      redisAdapter,
    });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    const ip = crypto.randomUUID();
    headers.mockReturnValue({ get: vi.fn(() => ip) });

    // Mock cookies
    const cookiesMock = {
      set: vi.fn(),
      get: vi.fn((name) => {
        if (name === 'session') {
          return { value: 'valid-session-cookie' };
        }
        return null;
      }),
      delete: vi.fn(),
    };
    cookies.mockReturnValue(cookiesMock);

    // Mock session
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });

    vi.spyOn(sessionManager, 'getSession').mockResolvedValue({
      userId,
      tenantId,
    });

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock crypto for verification code
    vi.spyOn(crypto, 'randomInt').mockReturnValue(123456);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addEmailAddress', () => {
    it('should successfully add a new email address', async () => {
      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(true);

      // Verify the email was added to the user
      const user = await userRepository.get({ userId });
      const hasEmail = user.emails.some(
        (e) => e.email === secondaryEmail && !e.verified && !e.primary
      );
      expect(hasEmail).toBe(true);

      // Verify a verification code was stored
      const verificationKey = `${userId}:${crypto.createHash('sha256').update(secondaryEmail).digest('hex')}`;
      const code = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });
      expect(code).toBe(123456);

      // Verify console log message for dev environment
      expect(console.log).toHaveBeenCalledWith(
        'Email verification code for new address:',
        123456
      );
    });

    it('should fail with invalid email format', async () => {
      const result = await addEmailAddress('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Invalid email address');
    });

    it('should fail when not authenticated', async () => {
      // Mock session to return null
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });
      vi.spyOn(sessionManager, 'getSession').mockResolvedValue(null);

      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('No session found');
    });

    it('should fail when missing userId in session', async () => {
      // Mock session with no userId
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });
      vi.spyOn(sessionManager, 'getSession').mockResolvedValue({
        tenantId,
      });

      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('No user ID found');
    });

    it('should fail with invalid high-risk action token', async () => {
      // Mock invalid token
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue(null),
      }));

      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');
      expect(result.requiresAuth).toBe(true);

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Invalid auth token');
    });

    it('should handle email validation error', async () => {
      // Force an exception during validation
      vi.spyOn(z.ZodString.prototype, 'email').mockImplementation(() => {
        throw new Error('Validation error');
      });

      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email validation failed');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Email validation failed');
    });

    it('should handle add email service error', async () => {
      // Mock addEmailAddressService to throw error
      vi.mock('@/backend/services/addEmailAddressService', () => ({
        AddEmailAddressService: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockRejectedValue(new Error('Service error')),
        })),
      }));

      const result = await addEmailAddress(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to add email address');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith(
        'Add email error:',
        expect.any(Error)
      );
      expect(console.error).toHaveBeenCalledWith('Add email error:');
    });
  });

  describe('verifyEmailAddress', () => {
    beforeEach(async () => {
      // Add an email to verify for each test
      await addEmailAddress(secondaryEmail);
      vi.clearAllMocks(); // Clear the logs from addEmailAddress
    });

    it('should successfully verify an email address', async () => {
      // Get the verification code
      const verificationKey = `${userId}:${crypto.createHash('sha256').update(secondaryEmail).digest('hex')}`;
      const code = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });

      // Verify the email
      const result = await verifyEmailAddress(secondaryEmail, code.toString());

      expect(result.success).toBe(true);

      // Check if the email is marked as verified
      const user = await userRepository.get({ userId });
      const emailEntry = user.emails.find((e) => e.email === secondaryEmail);
      expect(emailEntry.verified).toBe(true);
    });

    it('should fail with invalid verification code', async () => {
      // Try to verify with wrong code
      const result = await verifyEmailAddress(secondaryEmail, '999999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Invalid verification code');
    });

    it('should fail when no verification code stored', async () => {
      // Delete verification code
      const verificationKey = `${userId}:${crypto.createHash('sha256').update(secondaryEmail).digest('hex')}`;
      await emailVerificationCodeRepository.delete({ userId: verificationKey });

      const result = await verifyEmailAddress(secondaryEmail, '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('No stored code found');
    });

    it('should fail when email not found on account', async () => {
      const result = await verifyEmailAddress('nonexistent@test.com', '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith(
        'Email address not found on account'
      );
    });

    it('should fail with invalid verification code format', async () => {
      const result = await verifyEmailAddress(secondaryEmail, 'abcdef');

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        'Verification code must be a 6-digit number'
      );

      // Verify input validation error
      expect(console.log).toHaveBeenCalledWith('Invalid verification code');
    });

    it('should fail when not authenticated', async () => {
      // Mock session to return null
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });
      vi.spyOn(sessionManager, 'getSession').mockResolvedValue(null);

      const result = await verifyEmailAddress(secondaryEmail, '123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('No session found');
    });
  });

  describe('resendEmailVerification', () => {
    beforeEach(async () => {
      // Add an unverified email for each test
      await addEmailAddress(secondaryEmail);
      vi.clearAllMocks(); // Clear logs from addEmailAddress
    });

    it('should successfully resend verification code', async () => {
      // Manually delete the verification code
      const verificationKey = `${userId}:${crypto.createHash('sha256').update(secondaryEmail).digest('hex')}`;
      await emailVerificationCodeRepository.delete({ userId: verificationKey });

      // Resend verification
      const result = await resendEmailVerification(secondaryEmail);

      expect(result.success).toBe(true);

      // Verify a new code was stored
      const newCode = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });
      expect(newCode).toBe(123456);

      // Verify console log in dev environment
      expect(console.log).toHaveBeenCalledWith(
        'Email verification code for resend:',
        123456
      );
    });

    it('should fail for already verified email', async () => {
      // Verify the email first
      const verificationKey = `${userId}:${crypto.createHash('sha256').update(secondaryEmail).digest('hex')}`;
      const code = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });
      await verifyEmailAddress(secondaryEmail, code.toString());
      vi.clearAllMocks(); // Clear logs from verification

      // Try to resend verification
      const result = await resendEmailVerification(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email address is already verified');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith(
        'Email address is already verified'
      );
    });

    it('should fail when email not found on account', async () => {
      const result = await resendEmailVerification('nonexistent@test.com');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith(
        'Email address not found on account'
      );
    });

    it('should fail with invalid email format', async () => {
      const result = await resendEmailVerification('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Invalid email address');
    });

    it('should fail when not authenticated', async () => {
      // Mock session to return null
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });
      vi.spyOn(sessionManager, 'getSession').mockResolvedValue(null);

      const result = await resendEmailVerification(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('No session found');
    });
  });

  describe('setPrimaryEmail', () => {
    beforeEach(async () => {
      // Add and verify a secondary email for each test
      await addEmailAddress(secondaryEmail);
      const verificationKey = `${userId}:${crypto.createHash('sha256').update(secondaryEmail).digest('hex')}`;
      const code = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });
      await verifyEmailAddress(secondaryEmail, code.toString());
      vi.clearAllMocks(); // Clear logs from setup
    });

    it('should require high-risk action validation', async () => {
      // Simulate no high-risk token
      const result = await setPrimaryEmail(secondaryEmail);

      // Should fail with requiresAuth flag
      expect(result.success).toBe(false);
      expect(result.requiresAuth).toBe(true);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Invalid auth token');
    });

    it('should succeed with valid high-risk action token', async () => {
      // When creating a valid high-risk action token in tests, include a JTI
      const jti = crypto.randomUUID();
      const highRiskActionToken = jwt.sign(
        { userId, tenantId, type: 'highRiskActionValidated', jti },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );

      // Mock auth token validation
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue({
          userId,
          tenantId,
          type: 'highRiskActionValidated',
          jti,
        }),
      }));

      // Mock RedisAdapter for token tracking
      vi.spyOn(RedisAdapter.prototype, 'get').mockImplementation(
        async ({ key }) => {
          if (key.startsWith('used_token:')) {
            // Return null for token checks (indicating token not used)
            return null;
          }
          // For other Redis operations, return default implementation
          return null;
        }
      );

      vi.spyOn(RedisAdapter.prototype, 'set').mockImplementation(
        async ({ key, value, ttl }) => {
          // Mock implementation for token tracking
          return true;
        }
      );

      // Try to set as primary
      const result = await setPrimaryEmail(secondaryEmail);

      expect(result.success).toBe(true);

      // Verify it's set as primary
      const user = await userRepository.get({ userId });
      const primaryEmail = user.emails.find((e) => e.primary);
      expect(primaryEmail.email).toBe(secondaryEmail);
    });

    it('should fail with invalid email format', async () => {
      // Mock valid high-risk token
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue({
          userId,
          tenantId,
          type: 'highRiskActionValidated',
        }),
      }));

      const result = await setPrimaryEmail('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    it('should handle service errors', async () => {
      // Mock valid high-risk token
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue({
          userId,
          tenantId,
          type: 'highRiskActionValidated',
        }),
      }));

      // Mock setPrimaryEmailService to throw error
      vi.mock('@/backend/services/setPrimaryEmailService', () => ({
        SetPrimaryEmailService: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockRejectedValue(new Error('Service error')),
        })),
      }));

      const result = await setPrimaryEmail(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service error');

      // Verify error is logged
      expect(console.error).toHaveBeenCalledWith(
        'Set primary email error:',
        expect.any(Error)
      );
    });

    it('should fail when not authenticated', async () => {
      // Mock session to return null
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });
      vi.spyOn(sessionManager, 'getSession').mockResolvedValue(null);

      const result = await setPrimaryEmail(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('No session found');
    });
  });

  describe('removeEmail', () => {
    beforeEach(async () => {
      // Add and verify a secondary email for each test
      await addEmailAddress(secondaryEmail);
      const verificationKey = `${userId}:${crypto.createHash('sha256').update(secondaryEmail).digest('hex')}`;
      const code = await emailVerificationCodeRepository.get({
        userId: verificationKey,
      });
      await verifyEmailAddress(secondaryEmail, code.toString());
      vi.clearAllMocks(); // Clear logs from setup
    });

    it('should require high-risk action validation', async () => {
      // Attempt to remove without high-risk validation
      const result = await removeEmail(secondaryEmail);

      // Should fail with requiresAuth flag
      expect(result.success).toBe(false);
      expect(result.requiresAuth).toBe(true);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Invalid auth token');
    });

    it('should succeed with valid high-risk action token', async () => {
      // Mock valid high-risk token
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue({
          userId,
          tenantId,
          type: 'highRiskActionValidated',
        }),
      }));

      // Try to remove
      const result = await removeEmail(secondaryEmail);

      expect(result.success).toBe(true);

      // Verify it's removed
      const user = await userRepository.get({ userId });
      const hasEmail = user.emails.some((e) => e.email === secondaryEmail);
      expect(hasEmail).toBe(false);
    });

    it('should fail when trying to remove primary email even with token', async () => {
      // Mock valid high-risk token
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue({
          userId,
          tenantId,
          type: 'highRiskActionValidated',
        }),
      }));

      // Try to remove primary email
      const result = await removeEmail(testEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot remove primary email address');

      // Log should be captured by RemoveEmailService
      expect(console.log).toHaveBeenCalledWith(
        'Remove email error:',
        expect.any(Error)
      );
    });

    it('should fail with invalid email format', async () => {
      // Mock valid high-risk token
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue({
          userId,
          tenantId,
          type: 'highRiskActionValidated',
        }),
      }));

      const result = await removeEmail('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('Invalid email address');
    });

    it('should handle service errors', async () => {
      // Mock valid high-risk token
      vi.mock('@/utils/auth', () => ({
        verifyHighRiskActionToken: vi.fn().mockResolvedValue({
          userId,
          tenantId,
          type: 'highRiskActionValidated',
        }),
      }));

      // Mock removeEmailService to throw error
      vi.mock('@/backend/services/removeEmailService', () => ({
        RemoveEmailService: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockRejectedValue(new Error('Service error')),
        })),
      }));

      const result = await removeEmail(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Service error');

      // Verify error is logged
      expect(console.log).toHaveBeenCalledWith(
        'Remove email error:',
        expect.any(Error)
      );
      expect(console.error).toHaveBeenCalledWith(
        'Remove email error:',
        expect.any(Error)
      );
    });

    it('should fail when not authenticated', async () => {
      // Mock session to return null
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });
      vi.spyOn(sessionManager, 'getSession').mockResolvedValue(null);

      const result = await removeEmail(secondaryEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthenticated');

      // Verify specific log message
      expect(console.log).toHaveBeenCalledWith('No session found');
    });
  });
});
