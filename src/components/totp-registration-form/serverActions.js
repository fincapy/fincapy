'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import speakeasy from 'speakeasy';
import { RateLimiter } from '@/backend/adapters/rateLimiter';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { generateBackupCodes } from '@/utils/backupCodes';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Validation schemas
const tokenSchema = z.string().trim().min(6).max(8);
const secretSchema = z.string().trim().min(16);

// Sanitization options
const sanitizeOptions = {
  allowedTags: [],
  allowedAttributes: {},
};

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

export async function generateTOTPSecret() {
  try {
    const secret = speakeasy.generateSecret({
      name: 'Fincapy',
      issuer: 'Fincapy',
    });

    return {
      otpauthUrl: secret.otpauth_url,
      secret: secret.base32,
      success: true,
    };
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    return {
      success: false,
      error: 'Failed to generate authentication secret',
    };
  }
}

export async function verifyAndSaveTOTP(token, secret) {
  try {
    // Validate and sanitize inputs
    const validatedToken = tokenSchema.parse(token);
    const sanitizedToken = sanitizeHtml(validatedToken, sanitizeOptions);

    const validatedSecret = secretSchema.parse(secret);
    const sanitizedSecret = sanitizeHtml(validatedSecret, sanitizeOptions);

    const redisAdapter = new RedisAdapter({ redisClient });
    const rateLimiter = new RateLimiter({ redisAdapter });
    const headersList = await headers();
    const ip = headersList.get('fly-client-ip') || 'unknown-ip';

    try {
      await rateLimiter.checkRateLimit({
        key: `ip:totp-registration:${hashIp(ip)}`,
      });
    } catch (error) {
      console.log('Rate limit exceeded for IP');
      return {
        success: false,
        error: 'Too many attempts, please try again later',
      };
    }

    const isValid = speakeasy.totp.verify({
      secret: sanitizedSecret,
      encoding: 'base32',
      token: sanitizedToken,
      window: 1,
    });

    if (!isValid) {
      return { success: false, error: 'Invalid verification code' };
    }

    let jwtToken;
    const awaitingMFASetupAfterSignupCookie = (await cookies()).get(
      'emailPasswordAuthenticatedToken'
    );
    if (!awaitingMFASetupAfterSignupCookie) {
      return { success: false, error: 'Authentication required' };
    }
    try {
      jwtToken = await jwt.verify(
        awaitingMFASetupAfterSignupCookie.value,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] }
      );
    } catch (error) {
      console.log('JWT verification failed:', error);
      return { success: false, error: 'Invalid authentication token' };
    }
    if (jwtToken.type !== 'emailPasswordAuthenticated') {
      return { success: false, error: 'Invalid token type' };
    }

    try {
      await rateLimiter.checkRateLimit({
        key: `user:totp-registration:${jwtToken.userId}`,
      });
    } catch (error) {
      return {
        success: false,
        error: 'Too many attempts, please try again later',
      };
    }

    const userRepository = new UserRepository({ redisAdapter });
    const user = await userRepository.get({ userId: jwtToken.userId });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Generate backup codes for the user
    const { codes, hashedCodes } = await generateBackupCodes();
    user.totpSecret = sanitizedSecret;
    user.totpEnabled = true;
    user.backupCodes = hashedCodes; // Store hashed backup codes

    await userRepository.set({ userId: user.id, user });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.createSession({
      userId: jwtToken.userId,
      userRole: user.role,
      tenantId: jwtToken.tenantId,
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
    return { success: true, backupCodes: codes };
  } catch (error) {
    console.error('Error in verifyAndSaveTOTP:', error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error:
          'Invalid input: ' + error.errors.map((e) => e.message).join(', '),
      };
    }
    return { success: false, error: 'An unexpected error occurred' };
  }
}
