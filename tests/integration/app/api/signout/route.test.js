import { GET } from '@/app/api/signout/route';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { Session } from '@/backend/domain/session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

vi.mock('next/headers', () => {
  return {
    cookies: vi.fn(),
  };
});

vi.mock('next/navigation', () => {
  return {
    redirect: vi.fn(),
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

describe('Signout Route API', () => {
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
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('GET', () => {
    it('should successfully sign out with valid session', async () => {
      cookies.mockResolvedValue(validCookieResolution);

      await GET({});
      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should return 401 when no session exists', async () => {
      cookies.mockResolvedValue(missingCookieResolution);

      const response = await GET({});
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
