import {
  authenticateForMerge,
  verifyTOTPForMerge,
  confirmAccountMerge,
} from '@/components/merge-accounts-form/serverActions';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { generateBackupCodes } from '@/utils/backupCodes';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Generate TOTP secret for testing
const secret = speakeasy.generateSecret();

describe('Merge Accounts Form Server Actions', () => {
  let userRepository;
  let userId, tenantId, testEmail, testPassword, googleUserData;

  beforeEach(async () => {
    vi.resetAllMocks();
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.NODE_ENV = 'test';

    // Generate unique IDs for each test
    userId = uuidv4();
    tenantId = uuidv4();
    testEmail = `${userId}@test.com`;
    testPassword = 'testPassword123!';
    googleUserData = {
      email: testEmail,
      name: 'Test User',
      verified_email: true,
    };

    // Set up user with email/password auth
    const redisAdapter = new RedisAdapter({ redisClient });
    const transactionManager = new TransactionManager({ redisAdapter });
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
      authProvider: 'email', // Important: start as email/password account
    });

    userRepository = new UserRepository({ redisAdapter });

    // Mock headers for IP address
    headers.mockReturnValue({
      get: vi.fn(() => 'test-ip'),
    });

    // Set up console.log spy
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('authenticateForMerge', () => {
    it('should successfully authenticate email/password for merge with no 2FA', async () => {
      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await authenticateForMerge({
        email: testEmail,
        password: testPassword,
      });

      expect(result.success).toBe(true);
      expect(result.requiresTOTP).toBe(false);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'mergeAuthenticatedToken',
        expect.any(String),
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 10, // 10 minutes
        })
      );

      // Verify the token structure
      const mergeAuthToken = mockCookies.set.mock.calls[0][1];
      const decoded = jwt.verify(mergeAuthToken, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        type: 'mergeAuthenticated',
        userId,
        tenantId,
        requiresTOTP: false,
      });
    });

    it('should successfully authenticate email/password for merge with 2FA enabled', async () => {
      // Enable 2FA for the user
      const user = await userRepository.get({ userId });
      user.totpEnabled = true;
      user.totpSecret = secret.base32;
      await userRepository.set({ userId, user });

      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await authenticateForMerge({
        email: testEmail,
        password: testPassword,
      });

      expect(result.success).toBe(true);
      expect(result.requiresTOTP).toBe(true);
    });

    it('should fail with missing Google merge token', async () => {
      const mockCookies = {
        get: vi.fn(() => null),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await authenticateForMerge({
        email: testEmail,
        password: testPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Merge session expired');
    });

    it('should fail with invalid password', async () => {
      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await authenticateForMerge({
        email: testEmail,
        password: 'wrongPassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should fail with email that does not match merge token', async () => {
      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await authenticateForMerge({
        email: 'wrong@test.com',
        password: testPassword,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email does not match account');
    });
  });

  describe('verifyTOTPForMerge', () => {
    it('should successfully verify TOTP for merge', async () => {
      // Enable 2FA for the user
      const user = await userRepository.get({ userId });
      user.totpEnabled = true;
      user.totpSecret = secret.base32;
      await userRepository.set({ userId, user });

      const mergeAuthToken = jwt.sign(
        {
          type: 'mergeAuthenticated',
          userId,
          tenantId,
          mergeTokenId: userId,
          requiresTOTP: true,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'mergeAuthenticatedToken') {
            return { value: mergeAuthToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      // Generate valid TOTP token
      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      });

      const result = await verifyTOTPForMerge(token);

      expect(result.success).toBe(true);
      expect(mockCookies.set).toHaveBeenCalledWith(
        'mergeAuthenticatedToken',
        expect.any(String),
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 10, // 10 minutes
        })
      );

      // Verify updated token has correct type
      const updatedToken = mockCookies.set.mock.calls[0][1];
      const decoded = jwt.verify(updatedToken, process.env.JWT_SECRET);
      expect(decoded.type).toBe('mergeFullyAuthenticated');
    });

    it('should fail with invalid TOTP code', async () => {
      // Enable 2FA for the user
      const user = await userRepository.get({ userId });
      user.totpEnabled = true;
      user.totpSecret = secret.base32;
      await userRepository.set({ userId, user });

      const mergeAuthToken = jwt.sign(
        {
          type: 'mergeAuthenticated',
          userId,
          tenantId,
          mergeTokenId: userId,
          requiresTOTP: true,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'mergeAuthenticatedToken') {
            return { value: mergeAuthToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await verifyTOTPForMerge('123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid verification code');
    });

    it('should fail with missing merge auth token', async () => {
      const mockCookies = {
        get: vi.fn(() => null),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await verifyTOTPForMerge('123456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });
  });

  describe('confirmAccountMerge', () => {
    it('should successfully merge accounts and convert to Google-only auth', async () => {
      // Enable 2FA for the user initially
      const user = await userRepository.get({ userId });
      user.totpEnabled = true;
      user.totpSecret = secret.base32;
      user.backupCodes = [{ code: 'backup123', used: false }];
      await userRepository.set({ userId, user });

      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mergeAuthToken = jwt.sign(
        {
          type: 'mergeFullyAuthenticated',
          userId,
          tenantId,
          mergeTokenId: userId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          if (name === 'mergeAuthenticatedToken') {
            return { value: mergeAuthToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      await confirmAccountMerge();

      // Should redirect on success
      expect(redirect).toHaveBeenCalledWith('/app');

      // Verify user was converted to Google-only auth
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.authProvider).toBe('google');
      expect(updatedUser.password).toBeNull();
      expect(updatedUser.totpEnabled).toBe(false);
      expect(updatedUser.totpSecret).toBeNull();
      expect(updatedUser.backupCodes).toBeNull();
      expect(updatedUser.name).toBe(googleUserData.name);

      // Verify session cookie was set
      expect(mockCookies.set).toHaveBeenCalledWith(
        'session-id',
        expect.any(String),
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 3, // 3 hours
        })
      );

      // Verify merge tokens were cleared
      expect(mockCookies.set).toHaveBeenCalledWith(
        'googleAccountMergeToken',
        '',
        expect.objectContaining({ maxAge: 0 })
      );
      expect(mockCookies.set).toHaveBeenCalledWith(
        'mergeAuthenticatedToken',
        '',
        expect.objectContaining({ maxAge: 0 })
      );
    });

    it('should fail with missing tokens', async () => {
      const mockCookies = {
        get: vi.fn(() => null),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await confirmAccountMerge();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication required');
    });

    it('should fail with user ID mismatch between tokens', async () => {
      const otherUserId = uuidv4();

      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mergeAuthToken = jwt.sign(
        {
          type: 'mergeFullyAuthenticated',
          userId: otherUserId, // Different user ID
          tenantId,
          mergeTokenId: otherUserId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          if (name === 'mergeAuthenticatedToken') {
            return { value: mergeAuthToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await confirmAccountMerge();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication mismatch');
    });

    it('should succeed with partial authentication when no 2FA is enabled', async () => {
      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      // Use mergeAuthenticated (not fully authenticated) since no 2FA
      const mergeAuthToken = jwt.sign(
        {
          type: 'mergeAuthenticated',
          userId,
          tenantId,
          mergeTokenId: userId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          if (name === 'mergeAuthenticatedToken') {
            return { value: mergeAuthToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await confirmAccountMerge();

      // Should redirect on success
      expect(redirect).toHaveBeenCalledWith('/app');

      // Verify user was converted to Google-only auth
      const updatedUser = await userRepository.get({ userId });
      expect(updatedUser.authProvider).toBe('google');
      expect(updatedUser.password).toBeNull();
    });

    it('should fail when user has 2FA enabled but tries to bypass TOTP verification', async () => {
      // Enable 2FA for the user
      const user = await userRepository.get({ userId });
      user.totpEnabled = true;
      user.totpSecret = secret.base32;
      await userRepository.set({ userId, user });

      const googleMergeToken = jwt.sign(
        {
          type: 'googleAccountMerge',
          googleUserData,
          existingUserId: userId,
          existingUserTenantId: tenantId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      // Try to use mergeAuthenticated token when user has 2FA enabled (should fail)
      const mergeAuthToken = jwt.sign(
        {
          type: 'mergeAuthenticated', // This should be rejected for 2FA users
          userId,
          tenantId,
          mergeTokenId: userId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'googleAccountMergeToken') {
            return { value: googleMergeToken };
          }
          if (name === 'mergeAuthenticatedToken') {
            return { value: mergeAuthToken };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const result = await confirmAccountMerge();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Two-factor authentication required');
    });
  });
});
