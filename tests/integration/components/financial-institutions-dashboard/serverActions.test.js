import {
  fetchLinkToken,
  createPlaidItem,
  updatePlaidItem,
  deletePlaidItem,
} from '@/components/financial-institutions-dashboard/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { Session } from '@/backend/domain/session';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

const sessionId = uuidv4();
const viewerSessionId = uuidv4();
const tenantId = uuidv4();
const userId = uuidv4();

vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(),
  };
});

const validCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign({ sessionId, type: 'session' }, process.env.JWT_SECRET, {
      expiresIn: '3h',
      algorithm: 'HS256',
    }),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const viewerCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { sessionId: viewerSessionId, type: 'session' },
      process.env.JWT_SECRET,
      { expiresIn: '3h', algorithm: 'HS256' }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

const missingCookieResolution = {
  get: vi.fn(() => undefined),
  set: vi.fn(),
  delete: vi.fn(),
};

const invalidCookieResolution = {
  get: vi.fn(() => ({
    value: jwt.sign(
      { sessionId: 'invalid-session', type: 'session' },
      process.env.JWT_SECRET,
      {
        expiresIn: '3h',
        algorithm: 'HS256',
      }
    ),
  })),
  set: vi.fn(),
  delete: vi.fn(),
};

describe('Financial Institutions Dashboard Server Actions', () => {
  beforeAll(async () => {
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
    const viewerSession = new Session({
      sessionId: viewerSessionId,
      userId,
      userRole: 'viewer',
      tenantId,
      createdAt: new Date(),
      lastRotated: new Date(),
    });
    await sessionRepository.set({
      session: viewerSession,
      ttl: 60 * 60 * 3, // 3 hours
    });
    const transactionManager = new TransactionManager({
      redisAdapter,
    });
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
    });
    await setupNewTenantService.execute({
      tenantId,
      userId,
      email: `${userId}@test.com`,
      password: 'password',
      name: 'Test User',
      whitelistBilling: true,
    });
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('fetchLinkToken', () => {
    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);
      const params = {
        institutionId: 'ins_123',
      };

      const result = await fetchLinkToken(params);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);
      const params = {
        institutionId: 'ins_123',
      };

      const result = await fetchLinkToken(params);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);
      const params = {
        institutionId: 'ins_123',
      };

      const result = await fetchLinkToken(params);

      expect(result).toBe(false);
    });
  });

  describe('createPlaidItem', () => {
    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);
      const params = {
        publicToken: 'public-token-123',
        plaidItemId: 'item_123',
        institutionId: 'ins_123',
        institutionName: 'Test Bank',
      };

      const result = await createPlaidItem(params);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);
      const params = {
        publicToken: 'public-token-123',
        plaidItemId: 'item_123',
        institutionId: 'ins_123',
        institutionName: 'Test Bank',
      };

      const result = await createPlaidItem(params);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);
      const params = {
        publicToken: 'public-token-123',
        plaidItemId: 'item_123',
        institutionId: 'ins_123',
        institutionName: 'Test Bank',
      };

      const result = await createPlaidItem(params);

      expect(result).toBe(false);
    });
  });

  describe('updatePlaidItem', () => {
    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);
      const params = {
        plaidItemId: 'item_123',
        publicToken: 'public-token-123',
      };

      const result = await updatePlaidItem(params);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);
      const params = {
        plaidItemId: 'item_123',
        publicToken: 'public-token-123',
      };

      const result = await updatePlaidItem(params);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);
      const params = {
        plaidItemId: 'item_123',
        publicToken: 'public-token-123',
      };

      const result = await updatePlaidItem(params);

      expect(result).toBe(false);
    });
  });

  describe('deletePlaidItem', () => {
    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);
      const params = {
        plaidItemId: 'item_123',
      };

      const result = await deletePlaidItem(params);

      expect(result).toBe(false);
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);
      const params = {
        plaidItemId: 'item_123',
      };

      const result = await deletePlaidItem(params);

      expect(result).toBe(false);
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);
      const params = {
        plaidItemId: 'item_123',
      };

      const result = await deletePlaidItem(params);

      expect(result).toBe(false);
    });
  });
});
