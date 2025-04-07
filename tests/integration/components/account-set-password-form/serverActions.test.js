import { updatePassword } from '@/components/account-set-password-form/serverActions';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import bcrypt from 'bcryptjs';
import {
  vi,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterEach,
} from 'vitest';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}));

// Mock cookie implementation
const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

// Mock session manager
vi.mock('@/backend/adapters/auth', () => ({
  SessionManager: vi.fn().mockImplementation(() => ({
    touchSession: vi.fn(),
  })),
}));

describe('Account Set Password Form Server Actions', () => {
  let userRepository;
  let redisAdapter;
  let sessionRepository;
  let sessionManager;
  let user;
  let userId;
  let tenantId;
  const validPassword = 'ValidPass123!';
  const invalidPassword = 'weak';
  let consoleSpy;

  beforeAll(async () => {
    redisAdapter = new RedisAdapter({ redisClient });
    userRepository = new UserRepository({ redisAdapter });
    sessionRepository = new SessionRepository({ redisAdapter });
    sessionManager = new SessionManager({ sessionRepository });

    userId = uuidv4();
    tenantId = uuidv4();

    // Create a test user
    user = {
      id: userId,
      tenantId,
      emails: [{ email: 'test@example.com', verified: true }],
      mfa_method: 'totp',
    };

    await userRepository.set({ userId, user });
  });

  beforeEach(() => {
    vi.resetAllMocks();
    consoleSpy = vi.spyOn(console, 'log');

    // Setup session manager mock
    sessionManager.touchSession.mockResolvedValue({
      userId,
      tenantId,
    });

    // Mock the cookies() function to return our mock cookie store
    const { cookies } = require('next/headers');
    cookies.mockResolvedValue(mockCookieStore);
  });

  it('should successfully update password with valid token', async () => {
    // Create a valid highRiskActionValidatedToken
    const token = jwt.sign(
      { userId, tenantId, type: 'highRiskActionValidated' },
      process.env.JWT_SECRET,
      { expiresIn: '5m', algorithm: 'HS256' }
    );

    // Setup cookie mock
    mockCookieStore.get.mockImplementation((name) => {
      if (name === 'highRiskActionValidatedToken') {
        return { value: token };
      }
      return null;
    });

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: true });
    expect(mockCookieStore.delete).toHaveBeenCalledWith(
      'highRiskActionValidatedToken'
    );

    // Verify the user's password was updated
    const updatedUser = await userRepository.get({ userId });
    expect(updatedUser.password).toBeDefined();

    // Verify password was hashed correctly
    const passwordMatch = await bcrypt.compare(
      validPassword,
      updatedUser.password
    );
    expect(passwordMatch).toBe(true);
  });

  it('should return error with invalid password format', async () => {
    // Create a valid highRiskActionValidatedToken
    const token = jwt.sign(
      { userId, tenantId, type: 'highRiskActionValidated' },
      process.env.JWT_SECRET,
      { expiresIn: '5m', algorithm: 'HS256' }
    );

    // Setup cookie mock
    mockCookieStore.get.mockImplementation((name) => {
      if (name === 'highRiskActionValidatedToken') {
        return { value: token };
      }
      return null;
    });

    const result = await updatePassword(invalidPassword);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(
      /Password must be at least 8 characters long/
    );
    expect(mockCookieStore.delete).not.toHaveBeenCalled();
  });

  it('should return error when token is missing', async () => {
    // Setup cookie mock to return no token
    mockCookieStore.get.mockImplementation(() => null);

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: false, tokenInvalid: true });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Missing highRiskActionValidatedToken'
    );
  });

  it('should return error when token is expired', async () => {
    // Create an expired token
    const expiredToken = jwt.sign(
      { userId, tenantId, type: 'highRiskActionValidated' },
      process.env.JWT_SECRET,
      { expiresIn: '-5s', algorithm: 'HS256' }
    );

    // Setup cookie mock
    mockCookieStore.get.mockImplementation((name) => {
      if (name === 'highRiskActionValidatedToken') {
        return { value: expiredToken };
      }
      return null;
    });

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: false, tokenInvalid: true });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid or expired highRiskActionValidatedToken'
    );
  });

  it('should return error when token type is invalid', async () => {
    // Create a token with wrong type
    const wrongTypeToken = jwt.sign(
      { userId, tenantId, type: 'wrongType' },
      process.env.JWT_SECRET,
      { expiresIn: '5m', algorithm: 'HS256' }
    );

    // Setup cookie mock
    mockCookieStore.get.mockImplementation((name) => {
      if (name === 'highRiskActionValidatedToken') {
        return { value: wrongTypeToken };
      }
      return null;
    });

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: false, tokenInvalid: true });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Invalid token type - expected highRiskActionValidated'
    );
  });

  it('should return error when token userId does not match session userId', async () => {
    // Create a token with different userId
    const differentUserIdToken = jwt.sign(
      { userId: uuidv4(), tenantId, type: 'highRiskActionValidated' },
      process.env.JWT_SECRET,
      { expiresIn: '5m', algorithm: 'HS256' }
    );

    // Setup cookie mock
    mockCookieStore.get.mockImplementation((name) => {
      if (name === 'highRiskActionValidatedToken') {
        return { value: differentUserIdToken };
      }
      return null;
    });

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: false, tokenInvalid: true });
    expect(consoleSpy).toHaveBeenCalledWith(
      'Token userId does not match session userId'
    );
  });

  it('should return error when no active session is found', async () => {
    // Mock session manager to return no session
    sessionManager.touchSession.mockResolvedValue(null);

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: false, message: 'Session not found' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'No active session found in updatePassword'
    );
  });
});
