'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { AuthRateLimiter } from '@/backend/adapters/rateLimiter';
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

export async function verifyTOTP(rawToken, isBackupCode = false) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new AuthRateLimiter({ redisAdapter });
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  let jwtToken;
  try {
    const cookieValue = (await cookies()).get(
      'emailPasswordAuthenticatedToken'
    )?.value;
    if (!cookieValue) {
      console.log('TOTP authentication token missing');
      return false;
    }

    jwtToken = await jwt.verify(cookieValue, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    console.log('TOTP invalid authentication token');
    return false;
  }

  if (jwtToken.type !== 'emailPasswordAuthenticated') {
    console.log('TOTP invalid token type');
    return false;
  }

  return await rateLimiter.withRateLimit(
    { ip, processId: 'verifyTOTP', userId: jwtToken.userId },
    async () => {
      const validation = validateAndSanitize(
        rawToken,
        isBackupCode ? backupCodeSchema : totpSchema
      );
      const token = validation.data;

      if (!validation.success) {
        console.log('TOTP validation error');
        return false;
      }

      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId: jwtToken.userId });

      if (!user) {
        console.log('TOTP user not found');
        return false;
      }

      if (!isBackupCode && !user.totpSecret) {
        console.log('TOTP not set up for user');
        return false;
      }

      let isValid = false;

      if (isBackupCode) {
        if (!user.backupCodes || !Array.isArray(user.backupCodes)) {
          console.log('TOTP no backup codes available for user');
          return false;
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
        console.log('TOTP invalid verification code for user');
        return false;
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

        (await cookies()).set('emailPasswordAuthenticatedToken', '', {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 0,
        });

        return () => redirect('/app');
      } catch (error) {
        console.log('TOTP session creation error:', error);
        return false;
      }
    }
  );
}
