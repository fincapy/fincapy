'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import speakeasy from 'speakeasy';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { generateBackupCodes } from '@/utils/backupCodes';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { SessionManager } from '@/backend/adapters/auth';

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
    console.log('TOTP secret generation failed');
    return {
      success: false,
      error: 'Failed to generate authentication secret',
    };
  }
}

export async function verifyAndSaveTOTP(token, secret) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const cookiesList = await cookies();
  try {
    const session = await sessionManager.touchSession({ cookies: cookiesList });
    if (!session) {
      console.log('Session not found');
      return { success: false, error: 'Session not found' };
    }

    // Validate and sanitize inputs
    const validatedToken = tokenSchema.parse(token);
    const sanitizedToken = sanitizeHtml(validatedToken, sanitizeOptions);

    const validatedSecret = secretSchema.parse(secret);
    const sanitizedSecret = sanitizeHtml(validatedSecret, sanitizeOptions);

    const isValid = speakeasy.totp.verify({
      secret: sanitizedSecret,
      encoding: 'base32',
      token: sanitizedToken,
      window: 1,
    });

    if (!isValid) {
      console.log('Invalid TOTP verification code provided');
      return { success: false, error: 'Invalid verification code' };
    }

    let jwtToken;
    const highRiskActionValidatedToken = (await cookies()).get(
      'highRiskActionValidatedToken'
    );
    if (!highRiskActionValidatedToken) {
      console.log('Missing high risk action validated token');
      return { success: false, error: 'Authentication required' };
    }
    try {
      jwtToken = await jwt.verify(
        highRiskActionValidatedToken.value,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] }
      );
    } catch (error) {
      console.log('JWT verification failed for TOTP registration');
      return { success: false, error: 'Invalid authentication token' };
    }
    if (jwtToken.type !== 'highRiskActionValidated') {
      console.log('Invalid token type for TOTP registration');
      return { success: false, error: 'Invalid token type' };
    }

    const userRepository = new UserRepository({ redisAdapter });
    const user = await userRepository.get({ userId: jwtToken.userId });

    if (!user) {
      console.log('User not found during TOTP registration');
      return { success: false, error: 'User not found' };
    }

    // Generate backup codes for the user
    const { codes, hashedCodes } = await generateBackupCodes();
    user.totpSecret = sanitizedSecret;
    user.totpEnabled = true;
    user.backupCodes = hashedCodes; // Store hashed backup codes

    await userRepository.set({ userId: user.id, user });
    return { success: true, backupCodes: codes };
  } catch (error) {
    console.error('Error in verifyAndSaveTOTP:', error);
    if (error instanceof z.ZodError) {
      console.log('Invalid input provided for TOTP registration');
      return {
        success: false,
        error:
          'Invalid input: ' + error.errors.map((e) => e.message).join(', '),
      };
    }
    console.log('Unexpected error during TOTP registration');
    return { success: false, error: 'An unexpected error occurred' };
  }
}
