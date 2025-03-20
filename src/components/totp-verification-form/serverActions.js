'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { RateLimiter } from '@/backend/adapters/rateLimiter';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import speakeasy from 'speakeasy';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { verifyBackupCode } from '@/utils/backupCodes';
import {
  totpSchema,
  backupCodeSchema,
  validateAndSanitize,
} from '@/utils/validation';

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

export async function verifyTOTP(rawToken, isBackupCode = false) {
  // Validate input based on whether it's a TOTP or backup code
  const validation = validateAndSanitize(
    rawToken,
    isBackupCode ? backupCodeSchema : totpSchema
  );

  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  const token = validation.data;

  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  // Check IP-based rate limit for TOTP attempts
  try {
    await rateLimiter.checkRateLimit({
      key: `ip:totp:${hashIp(ip)}`,
    });
  } catch (error) {
    return {
      success: false,
      error: 'Too many attempts. Please try again later.',
    };
  }

  let jwtToken;
  try {
    const cookieValue = (await cookies()).get(
      'emailPasswordAuthenticatedToken'
    )?.value;
    if (!cookieValue) {
      return { success: false, error: 'Authentication token missing' };
    }

    jwtToken = await jwt.verify(cookieValue, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    return { success: false, error: 'Invalid authentication token' };
  }

  (await cookies()).set('emailPasswordAuthenticatedToken', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
  });

  if (jwtToken.type !== 'emailPasswordAuthenticated') {
    return { success: false, error: 'Invalid token type' };
  }

  try {
    await rateLimiter.checkRateLimit({
      key: `user:totp:${jwtToken.userId}`,
    });
  } catch (error) {
    return { success: false, error: 'Too many authentication attempts' };
  }

  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: jwtToken.userId });

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  if (!isBackupCode && !user.totpSecret) {
    return { success: false, error: 'TOTP not set up for this user' };
  }

  let isValid = false;

  if (isBackupCode) {
    if (!user.backupCodes || !Array.isArray(user.backupCodes)) {
      return { success: false, error: 'No backup codes available' };
    }

    const codeIndex = await verifyBackupCode(token, user.backupCodes);
    if (codeIndex >= 0) {
      user.backupCodes[codeIndex].used = true;
      await userRepository.set({ userId: user.id, user });
      isValid = true;
    }
  } else {
    // Verify TOTP code
    isValid = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: token,
      window: 1,
    });
  }

  if (!isValid) {
    return { success: false, error: 'Invalid verification code' };
  }

  try {
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.createSession({
      userId: jwtToken.userId,
      tenantId: user.tenantId,
      userRole: user.role,
      cookies: await cookies(),
    });

    const sessionToken = jwt.sign(
      { sessionId: session.sessionId, type: 'session' },
      process.env.JWT_SECRET,
      { expiresIn: '3h', algorithm: 'HS256' }
    );

    (await cookies()).set('session-id', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 3 * 1000, // 3 hours
    });

    redirect('/app');
  } catch (error) {
    console.error('Session creation error:', error);
    return {
      success: false,
      error: 'Failed to create session. Please try again.',
    };
  }
}
