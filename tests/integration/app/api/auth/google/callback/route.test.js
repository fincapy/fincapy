import { GET } from '@/app/api/auth/google/callback/route';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { Session } from '@/backend/domain/session';
import { cookies } from 'next/headers';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Google OAuth Callback API Route', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    global.fetch = vi.fn();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.NODE_ENV = 'test';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test-secret-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('High Risk Action Flow', () => {
    it('should mint high risk action token for existing Google user in high risk action flow', async () => {
      const userId = uuidv4();
      const tenantId = uuidv4();
      const testEmail = `test-${uuidv4()}@example.com`;

      // Create existing Google user
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: 'dummy-password',
        name: 'Test User',
        whitelistBilling: true,
        emailVerified: true,
        authProvider: 'google',
      });

      // Create active session for the user
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionManager = new SessionManager({ sessionRepository });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId,
        userRole: 'owner',
        tenantId,
        createdAt: Date.now(),
        lastRotated: Date.now(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });

      // Mock Google OAuth token exchange
      const mockTokenResponse = {
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token',
        }),
      };

      const mockUserResponse = {
        ok: true,
        json: async () => ({
          email: testEmail,
          name: 'Test User',
          verified_email: true,
        }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockUserResponse);

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                { expiresIn: '3h', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const request = new Request(
        'http://localhost:3000/api/auth/google/callback?code=mock-code&state=high_risk_action'
      );

      // Expect the redirect to be thrown
      try {
        await GET(request);
        expect.fail('Expected redirect error to be thrown');
      } catch (error) {
        expect(error.message).toBe('NEXT_REDIRECT');
        expect(error.digest).toContain('/app?auth=success');
      }

      expect(mockCookies.set).toHaveBeenCalledWith(
        'highRiskActionValidatedToken',
        expect.any(String),
        {
          path: '/',
          httpOnly: true,
          secure: false, // NODE_ENV is test
          sameSite: 'lax',
          maxAge: 60 * 5, // 5 minutes
        }
      );

      // Verify the high risk action token contains correct data
      const tokenCall = mockCookies.set.mock.calls.find(
        (call) => call[0] === 'highRiskActionValidatedToken'
      );
      const token = tokenCall[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        userId,
        tenantId,
        type: 'highRiskActionValidated',
      });
      expect(decoded.jti).toBeDefined();
    });

    it('should fail high risk action for non-matching session user', async () => {
      const userId = uuidv4();
      const differentUserId = uuidv4();
      const tenantId = uuidv4();
      const differentTenantId = uuidv4();
      const testEmail = `test-${uuidv4()}@example.com`;

      // Create existing Google user
      const redisAdapter = new RedisAdapter({ redisClient });
      const transactionManager = new TransactionManager();
      const setupNewTenantService = new SetupNewTenantService({
        transactionManager,
      });
      await setupNewTenantService.execute({
        tenantId,
        userId,
        email: testEmail,
        password: 'dummy-password',
        name: 'Test User',
        whitelistBilling: true,
        emailVerified: true,
        authProvider: 'google',
      });

      // Create session for different user
      const sessionRepository = new SessionRepository({ redisAdapter });
      const sessionId = uuidv4();
      const session = new Session({
        sessionId,
        userId: differentUserId, // Different user ID
        userRole: 'owner',
        tenantId: differentTenantId,
        createdAt: Date.now(),
        lastRotated: Date.now(),
      });
      await sessionRepository.set({
        session,
        ttl: 60 * 60 * 3, // 3 hours
      });

      // Mock Google OAuth responses
      const mockTokenResponse = {
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token',
        }),
      };

      const mockUserResponse = {
        ok: true,
        json: async () => ({
          email: testEmail,
          name: 'Test User',
          verified_email: true,
        }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockUserResponse);

      const mockCookies = {
        get: vi.fn((name) => {
          if (name === 'session-id') {
            return {
              value: jwt.sign(
                { sessionId, type: 'session' },
                process.env.JWT_SECRET,
                { expiresIn: '3h', algorithm: 'HS256' }
              ),
            };
          }
          return null;
        }),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const request = new Request(
        'http://localhost:3000/api/auth/google/callback?code=mock-code&state=high_risk_action'
      );

      // Expect the redirect to be thrown
      try {
        await GET(request);
        expect.fail('Expected redirect error to be thrown');
      } catch (error) {
        expect(error.message).toBe('NEXT_REDIRECT');
        expect(error.digest).toContain('/app?error=authentication_mismatch');
      }

      expect(mockCookies.set).not.toHaveBeenCalledWith(
        'highRiskActionValidatedToken',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should redirect to signup error for non-existent user in high risk action flow', async () => {
      const testEmail = `nonexistent-${uuidv4()}@example.com`;

      // Mock Google OAuth responses
      const mockTokenResponse = {
        ok: true,
        json: async () => ({
          access_token: 'mock-access-token',
        }),
      };

      const mockUserResponse = {
        ok: true,
        json: async () => ({
          email: testEmail,
          name: 'Test User',
          verified_email: true,
        }),
      };

      global.fetch = vi
        .fn()
        .mockResolvedValueOnce(mockTokenResponse)
        .mockResolvedValueOnce(mockUserResponse);

      const mockCookies = {
        get: vi.fn(() => null),
        set: vi.fn(),
      };

      cookies.mockResolvedValue(mockCookies);

      const request = new Request(
        'http://localhost:3000/api/auth/google/callback?code=mock-code&state=high_risk_action'
      );

      // Expect the redirect error to be thrown
      try {
        await GET(request);
        expect.fail('Expected redirect error to be thrown');
      } catch (error) {
        expect(error.message).toBe('NEXT_REDIRECT');
        // High-risk actions come from signin context, so should redirect to signin page
        expect(error.digest).toContain('/signin?error=account_not_found');
      }
    });
  });
});
