import {
  editTransaction,
  deleteTransaction,
} from '@/components/transaction-table/serverActions';
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

describe('Transaction Table Server Actions', () => {
  let consoleLogSpy;

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
    consoleLogSpy = vi.spyOn(console, 'log');
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('editTransaction', () => {
    it('should successfully edit a transaction', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a transaction
      const transactionId = uuidv4();
      const categoryId = 'spending_other';
      const createData = {
        transactionId,
        planId,
        categoryId,
        date: '2024-03-20',
        description: 'Original Transaction',
        status: 'COMPLETED',
        type: 'spending',
        amount: 100,
      };

      await createTransaction(createData);

      // Then edit it
      const editData = {
        transactionId,
        planId,
        categoryId,
        date: '2024-03-21',
        description: 'Updated Transaction',
        status: 'COMPLETED',
        type: 'spending',
        amount: 150,
        newCategoryId: categoryId,
      };

      const result = await editTransaction(editData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const editData = {
        transactionId: uuidv4(),
        planId,
        categoryId: uuidv4(),
        date: '2024-03-21',
        description: 'Updated Transaction',
        status: 'completed',
        type: 'expense',
        amount: 150,
        newCategoryId: uuidv4(),
      };

      const result = await editTransaction(editData);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Transaction edit failed: Insufficient permissions - viewer role'
      );
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const editData = {
        transactionId: uuidv4(),
        planId,
        categoryId: uuidv4(),
        date: '2024-03-21',
        description: 'Updated Transaction',
        status: 'completed',
        type: 'expense',
        amount: 150,
        newCategoryId: uuidv4(),
      };

      const result = await editTransaction(editData);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Transaction edit failed: No valid session found'
      );
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const editData = {
        transactionId: uuidv4(),
        planId,
        categoryId: uuidv4(),
        date: '2024-03-21',
        description: 'Updated Transaction',
        status: 'completed',
        type: 'expense',
        amount: 150,
        newCategoryId: uuidv4(),
      };

      const result = await editTransaction(editData);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Transaction edit failed: No valid session found'
      );
    });

    it('should return false with invalid data', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const editData = {
        transactionId: uuidv4(),
        planId,
        categoryId: uuidv4(),
        date: 'invalid-date', // Invalid date format
        description: 'Updated Transaction',
        status: 'completed',
        type: 'expense',
        amount: 150,
        newCategoryId: uuidv4(),
      };

      const result = await editTransaction(editData);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Transaction edit failed: Invalid input data'
      );
    });
  });

  describe('deleteTransaction', () => {
    it('should successfully delete a transaction', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      // First create a transaction
      const transactionId = uuidv4();
      const categoryId = uuidv4();
      const createData = {
        transactionId,
        planId,
        categoryId,
        date: '2024-03-20',
        description: 'Transaction to Delete',
        status: 'pending',
        type: 'expense',
        amount: 100,
      };

      await createTransaction(createData);

      // Then delete it
      const deleteData = {
        transactionId,
        planId,
      };

      const result = await deleteTransaction(deleteData);

      expect(result).toBe(true);
    });

    it('should return false when user role is viewer', async () => {
      cookies.mockResolvedValue(viewerCookieResolution);

      const deleteData = {
        transactionId: uuidv4(),
        planId,
      };

      const result = await deleteTransaction(deleteData);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Transaction delete failed: Insufficient permissions - viewer role'
      );
    });

    it('should return false when no cookie exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const deleteData = {
        transactionId: uuidv4(),
        planId,
      };

      const result = await deleteTransaction(deleteData);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Transaction delete failed: No valid session found'
      );
    });

    it('should return false when no session exists', async () => {
      cookies.mockResolvedValue(invalidCookieResolution);

      const deleteData = {
        transactionId: uuidv4(),
        planId,
      };

      const result = await deleteTransaction(deleteData);

      expect(result).toBe(false);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Transaction delete failed: No valid session found'
      );
    });
  });
});
