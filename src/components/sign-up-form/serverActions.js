'use server';

import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RateLimiter } from '@/backend/adapters/rateLimiter';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex');
}

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

// Schema for user input validation
const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  accessCode: z.string().min(1, 'Access code is required'),
});

// Sanitize HTML content to prevent XSS attacks
function sanitizeInput(input) {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
  return input;
}

export async function createAccount(name, email, password, accessCode) {
  try {
    // Sanitize inputs
    const sanitizedName = sanitizeInput(name);
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedAccessCode = sanitizeInput(accessCode);
    // Note: We don't sanitize password as it shouldn't be rendered as HTML

    // Validate inputs
    const validationResult = createAccountSchema.safeParse({
      name: sanitizedName,
      email: sanitizedEmail,
      password,
      accessCode: sanitizedAccessCode,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      return false;
    }

    const {
      name: validatedName,
      email: validatedEmail,
      password: validatedPassword,
      accessCode: validatedAccessCode,
    } = validationResult.data;

    if (
      validatedAccessCode !== process.env.NEXT_PUBLIC_SITE_ACCESS_CODE &&
      process.env.NODE_ENV === 'production'
    ) {
      return false;
    }
    const redisAdapter = new RedisAdapter({ redisClient });
    const rateLimiter = new RateLimiter({ redisAdapter });
    const headersList = await headers();
    const ip = headersList.get('fly-client-ip') || 'unknown-ip';
    try {
      await rateLimiter.checkRateLimit({
        key: `ip:sign-up:${hashIp(ip)}`,
      });
      await rateLimiter.checkRateLimit({
        key: `email:sign-up:${hashEmail(validatedEmail)}`,
      });
    } catch (error) {
      console.log('error', error);
      return false;
    }
    const transactionManager = new TransactionManager();
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
    });
    const userId = crypto.randomUUID();
    const tenantId = crypto.randomUUID();
    await setupNewTenantService.execute({
      tenantId,
      userId,
      name: validatedName,
      email: validatedEmail,
      password: validatedPassword,
      whitelistBilling: true,
    });
    const emailPasswordAuthenticatedToken = jwt.sign(
      { userId, tenantId, type: 'emailPasswordAuthenticated' },
      process.env.JWT_SECRET,
      { expiresIn: '10m', algorithm: 'HS256' }
    );
    (await cookies()).set(
      'emailPasswordAuthenticatedToken',
      emailPasswordAuthenticatedToken,
      {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 10 * 1000, // 10 minutes
      }
    );
    const emailVerificationCode = crypto.randomInt(100000, 999999);
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
      }
    );
    await emailVerificationCodeRepository.set({
      emailVerificationCode,
      userId,
      ttl: 60 * 10,
    });
    if (process.env.NODE_ENV === 'production') {
      const sesAdapter = new SESAdapter();
      await sesAdapter.sendEmail({
        to: validatedEmail,
        subject: 'Verify your Fincapy account',
        text: `Your verification code is: ${emailVerificationCode}\n\nThis code will expire in 10 minutes.`,
      });
    } else {
      console.log('emailVerificationCode', emailVerificationCode);
    }
  } catch (error) {
    console.error('Account creation error:', error);
    return false;
  }
  redirect('/verify-email');
}
