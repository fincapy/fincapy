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
const userIdRateLimited = uuidv4();
const tenantId = uuidv4();
const secret = speakeasy.generateSecret();

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

describe('TOTP Verification Reauth Form Server Actions', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    headers.mockReturnValue({ get: vi.fn(() => crypto.randomUUID()) });
    vi.spyOn(console, 'log');

    // Setup test user with TOTP secret
    const redisAdapter = new RedisAdapter({ redisClient });
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

    // Mock cookies
    cookies.mockReturnValue({
      set: vi.fn(),
      get: vi.fn(),
    });
  });

  describe('verifyTOTPForHighRiskAction', () => {
    it('should successfully verify valid TOTP token with active session', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      });

      const result = await verifyTOTPForHighRiskAction(token);

      expect(result).toBe(true);
      expect(cookies().set).toHaveBeenCalledWith(
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
      const highRiskActionToken = cookies().set.mock.calls[0][1];
      const decoded = jwt.verify(highRiskActionToken, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        userId,
        tenantId,
        type: 'highRiskActionValidated',
      });
    });

    it('should successfully verify valid backup code with active session', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      // Prepare a valid backup code
      const backupCodes = await generateBackupCodes();
      const backupCode = backupCodes.codes[0];

      // Update user with this backup code
      const redisAdapter = new RedisAdapter({ redisClient });
      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId });
      user.backupCodes = [backupCodes.hashedCodes[0]];
      await userRepository.set({ userId, user });

      const result = await verifyTOTPForHighRiskAction(backupCode, true);

      expect(result).toBe(true);
      expect(cookies().set).toHaveBeenCalledWith(
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
    });

    it('should fail with no active session', async () => {
      // Mock no active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock touchSession to return false (no valid session)
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(false);

      const token = speakeasy.totp({
        secret: secret.base32,
        encoding: 'base32',
      });

      const result = await verifyTOTPForHighRiskAction(token);

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('No active session found');
    });

    it('should fail with invalid TOTP token', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      const result = await verifyTOTPForHighRiskAction('123456');

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'TOTP invalid verification code for user'
      );
    });

    it('should fail with invalid backup code', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value
      const mockSession = {
        userId: userId,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      const result = await verifyTOTPForHighRiskAction('INVALID123456', true);

      expect(result).toBe(false);
      expect(cookies().set).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        'TOTP invalid verification code for user'
      );
    });

    it('should respect rate limiting', async () => {
      // Mock an active session
      const sessionRepository = new SessionRepository({
        redisAdapter: new RedisAdapter({ redisClient }),
      });
      const sessionManager = new SessionManager({ sessionRepository });

      // Mock session return value with rate limited user
      const mockSession = {
        userId: userIdRateLimited,
        tenantId: tenantId,
      };

      // Mock touchSession to return a valid session
      vi.spyOn(sessionManager, 'touchSession').mockResolvedValue(mockSession);

      // Set a consistent IP for rate limit testing
      const testIp = '127.0.0.1';
      headers.mockReturnValue({ get: vi.fn(() => testIp) });

      const token = '123456';

      for (let i = 0; i < 10; i++) {
        await verifyTOTPForHighRiskAction(token);
      }

      const result = await verifyTOTPForHighRiskAction(token);
      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith('IP Rate limit exceeded');
    });
  });
});
