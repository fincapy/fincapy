import { createTransaction } from '@/components/transactions-dashboard/serverActions';
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
const planId = 'initial';

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

describe('Transaction Dashboard Server Actions', () => {
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
    vi.spyOn(console, 'log');
    vi.spyOn(console, 'error');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('should successfully create a transaction', async () => {
      cookies.mockResolvedValue(validCookieResolution);
      const transactionData = {
        planId,
        categoryId: uuidv4(),
        date: '2024-03-20',
        description: 'Test Transaction',
        status: 'pending',
        type: 'expense',
        amount: 100.5,
        transactionId: uuidv4(),
      };

      const result = await createTransaction(transactionData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const transactionData = {
        planId,
        categoryId: uuidv4(),
        date: '2024-03-20',
        description: 'Test Transaction',
        status: 'pending',
        type: 'expense',
        amount: 100.5,
        transactionId: uuidv4(),
      };

      const result = await createTransaction(transactionData);

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Transaction creation failed: Insufficient permissions - viewer role'
      );
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const transactionData = {
        planId,
        categoryId: uuidv4(),
        date: '2024-03-20',
        description: 'Test Transaction',
        status: 'pending',
        type: 'expense',
        amount: 100.5,
        transactionId: uuidv4(),
      };

      const result = await createTransaction(transactionData);

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Transaction creation failed: No valid session found'
      );
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const transactionData = {
        planId,
        categoryId: uuidv4(),
        date: '2024-03-20',
        description: 'Test Transaction',
        status: 'pending',
        type: 'expense',
        amount: 100.5,
        transactionId: uuidv4(),
      };

      const result = await createTransaction(transactionData);

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Transaction creation failed: No valid session found'
      );
    });

    it('should return false when validation fails', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const invalidTransactionData = {
        planId,
        categoryId: uuidv4(),
        date: 'invalid-date', // Invalid date format
        description: 'Test Transaction',
        status: 'pending',
        type: 'expense',
        amount: -100, // Invalid negative amount
        transactionId: uuidv4(),
      };

      const result = await createTransaction(invalidTransactionData);

      expect(result).toBe(false);
      expect(console.log).toHaveBeenCalledWith(
        'Transaction creation failed: Invalid input data'
      );
    });

    it('should handle sanitized input correctly', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const transactionData = {
        planId,
        categoryId: uuidv4(),
        date: '2024-03-20',
        description: '<script>alert("xss")</script>Test Transaction', // Should be sanitized
        status: 'pending',
        type: 'expense',
        amount: 100.5,
        transactionId: uuidv4(),
      };

      const result = await createTransaction(transactionData);

      expect(result).toBe(true);
    });
  });
});
