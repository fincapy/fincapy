import { GET } from '@/app/api/plan/route';
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
const tenantId = uuidv4();
const userId = uuidv4();
const planId = 'test-plan';

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

describe('Plan Route API', () => {
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

  describe('GET', () => {
    it('should successfully retrieve plan data with valid parameters', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            startDate: '2024-03-01',
            endDate: '2024-03-31',
            planId: 'initial',
          }),
        },
      };

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toBeDefined();
      expect(data.planId).toBe('initial');
    });

    it('should return 401 when no session exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            startDate: '2024-03-01',
            endDate: '2024-03-31',
            planId: 'test-plan',
          }),
        },
      };

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid date format', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            startDate: '03-01-2024', // Invalid format
            endDate: '2024-03-31',
            planId: 'initial',
          }),
        },
      };

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 400 when start date is after end date', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            startDate: '2024-03-31',
            endDate: '2024-03-01',
            planId: 'initial',
          }),
        },
      };

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Start date must be before end date');
    });

    it('should return 400 for invalid plan ID format', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            startDate: '2024-03-01',
            endDate: '2024-03-31',
            planId: 'test plan!@#', // Invalid format
          }),
        },
      };

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should return 404 when plan is not found', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({
            startDate: '2024-03-01',
            endDate: '2024-03-31',
            planId: 'non-existent-plan',
          }),
        },
      };

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Plan not found');
    });
  });
});
