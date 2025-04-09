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

// Mock verifyHighRiskActionToken
vi.mock('@/utils/auth', () => ({
  verifyHighRiskActionToken: vi.fn(),
}));

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

    // Setup verifyHighRiskActionToken mock to return a valid token
    const { verifyHighRiskActionToken } = require('@/utils/auth');
    verifyHighRiskActionToken.mockResolvedValue({ userId, tenantId });
  });

  it('should successfully update password with valid token and credentials', async () => {
    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: true });

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
    const result = await updatePassword(invalidPassword);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(
      /Password must be at least 8 characters long/
    );
  });

  it('should return error when password fails validation', async () => {
    // Test password that fails other validations
    const noUppercasePassword = 'noupperletter123!';
    const result = await updatePassword(noUppercasePassword);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(
      /Password must contain at least one uppercase letter/
    );
  });

  it('should return error when no active session is found', async () => {
    // Mock session manager to return no session
    sessionManager.touchSession.mockResolvedValue(null);

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: false, message: 'Unauthenticated' });
    expect(consoleSpy).toHaveBeenCalledWith(
      'No active session found in updatePassword'
    );
  });

  it('should return error when password validation fails internally', async () => {
    // Mock Zod to throw a non-Zod error
    vi.mock('zod', () => {
      return {
        z: {
          string: () => ({
            min: () => ({
              max: () => ({
                regex: () => ({
                  regex: () => ({
                    regex: () => ({
                      regex: () => {
                        throw new Error('Some unexpected error');
                      },
                    }),
                  }),
                }),
              }),
            }),
          }),
        },
      };
    });

    // Need to re-import to get the mocked version
    jest.resetModules();
    const {
      updatePassword,
    } = require('@/components/account-set-password-form/serverActions');

    const result = await updatePassword(validPassword);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthenticated');
    expect(consoleSpy).toHaveBeenCalledWith(
      'Password validation error in updatePassword'
    );

    // Reset the mock
    vi.resetModules();
  });

  it('should return error when high risk action token is invalid', async () => {
    const { verifyHighRiskActionToken } = require('@/utils/auth');
    verifyHighRiskActionToken.mockResolvedValue(null);

    const result = await updatePassword(validPassword);

    expect(result).toEqual({
      success: false,
      message: 'Unauthenticated',
      tokenInvalid: true,
    });
  });

  it('should return error when token userId does not match session userId', async () => {
    const { verifyHighRiskActionToken } = require('@/utils/auth');
    verifyHighRiskActionToken.mockResolvedValue({
      userId: 'different-user-id',
      tenantId,
    });

    const result = await updatePassword(validPassword);

    expect(result).toEqual({
      success: false,
      message: 'Unauthenticated',
      tokenInvalid: true,
    });
  });

  it('should return error when user is not found', async () => {
    // Mock userRepository.get to return null
    vi.spyOn(userRepository, 'get').mockResolvedValue(null);

    const result = await updatePassword(validPassword);

    expect(result).toEqual({ success: false, message: 'Unexpected error' });
    expect(consoleSpy).toHaveBeenCalledWith('User not found');
  });

  it('should sanitize the password input', async () => {
    const passwordWithHtml = '<script>ValidPass123!</script>';
    const result = await updatePassword(passwordWithHtml);

    expect(result).toEqual({ success: true });

    // Verify the password was sanitized and set
    const updatedUser = await userRepository.get({ userId });

    // The sanitized password should be "ValidPass123!" without the HTML tags
    const passwordMatch = await bcrypt.compare(
      'ValidPass123!',
      updatedUser.password
    );
    expect(passwordMatch).toBe(true);
  });
});
