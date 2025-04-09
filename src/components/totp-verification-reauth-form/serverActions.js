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
import crypto from 'crypto';
import { verifyBackupCode } from '@/utils/backupCodes';
import {
  totpSchema,
  backupCodeSchema,
  validateAndSanitize,
} from '@/utils/validation';

export async function verifyTOTPForHighRiskAction(isBackupCode = false) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new AuthRateLimiter({ redisAdapter });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  // Verify user has an active session
  const session = await sessionManager.touchSession({
    cookies: await cookies(),
  });
  if (!session) {
    console.log('No active session found');
    return false;
  }

  return await rateLimiter.withRateLimit(
    { ip, processId: 'verifyTOTPForHighRiskAction', userId: session.userId },
    async () => {
      const cookiesList = await cookies();
      const token = cookiesList.get(
        'emailPasswordAuthenticatedHighRiskActionToken'
      )?.value;
      if (!token) {
        console.log('No token found');
        return false;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (error) {
        console.log('Invalid token');
        return false;
      }
      if (decoded.type !== 'emailPasswordAuthenticatedHighRiskAction') {
        console.log('Invalid token type');
        return false;
      }

      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId: decoded.userId });

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

      // Set highRiskActionValidated token
      const jti = crypto.randomUUID();
      const highRiskActionValidatedToken = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          type: 'highRiskActionValidated',
          jti,
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m', algorithm: 'HS256' }
      );

      (await cookies()).set(
        'highRiskActionValidatedToken',
        highRiskActionValidatedToken,
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 5 * 1000, // 5 minutes
        }
      );

      return true;
    }
  );
}
