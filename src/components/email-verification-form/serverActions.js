'use server';

import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { RateLimiter } from '@/backend/adapters/rateLimiter';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import jwt from 'jsonwebtoken';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import crypto from 'crypto';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

// Create validation schema for tokens
const tokenSchema = z.object({
  type: z.literal('emailPasswordAuthenticated'),
  userId: z.string().uuid(),
  tenantId: z.string().uuid().optional(),
});

// Create validation schema for verification code
const verificationCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: 'Verification code must be a 6-digit number' });

// Sanitize inputs to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

export async function resendEmailVerificationCode() {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });
  const headersList = await headers();
  const ip = sanitizeInput(headersList.get('fly-client-ip') || 'unknown-ip');

  try {
    await rateLimiter.checkRateLimit({
      key: `ip:email-verification-resend:${hashIp(ip)}`,
    });
  } catch (error) {
    console.log('Rate limit exceeded for resend email');
    return false;
  }

  let token;
  try {
    const cookieValue = (await cookies()).get(
      'emailPasswordAuthenticatedToken'
    )?.value;
    if (!cookieValue) {
      console.log('No email password authentication token found');
      return false;
    }

    token = await jwt.verify(cookieValue, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Validate token structure
    const tokenValidation = tokenSchema.safeParse(token);
    if (!tokenValidation.success) {
      console.log('Token validation failed:', tokenValidation.error);
      return false;
    }

    token = tokenValidation.data;
  } catch (error) {
    console.log('Invalid token:', error);
    return false;
  }

  // Generate a new verification code
  const emailVerificationCode = crypto.randomInt(100000, 999999);
  const emailVerificationCodeRepository = new EmailVerificationCodeRepository({
    redisAdapter,
  });

  // Save the new code
  await emailVerificationCodeRepository.set({
    emailVerificationCode,
    userId: token.userId,
    ttl: 60 * 10, // 10 minutes
  });

  // Get the user to find their email
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: token.userId });
  if (!user) {
    console.log('User not found');
    return false;
  }

  const primaryEmail = user.emails.find(
    (email) => email.primary === true
  )?.email;
  if (!primaryEmail) {
    console.log('No primary email found for user');
    return false;
  }

  // Send the email with the new code
  if (process.env.NODE_ENV === 'production') {
    const sesAdapter = new SESAdapter();
    await sesAdapter.sendEmail({
      to: primaryEmail,
      subject: 'Verify your Fincapy account',
      text: `Your verification code is: ${emailVerificationCode}\n\nThis code will expire in 10 minutes.`,
    });
  } else {
    console.log('Resent emailVerificationCode', emailVerificationCode);
  }

  return true;
}

export async function verifyEmail(unverifiedEmailVerificationCode) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });
  const headersList = await headers();
  const ip = sanitizeInput(headersList.get('fly-client-ip') || 'unknown-ip');
  try {
    await rateLimiter.checkRateLimit({
      key: `ip:email-verification:${hashIp(ip)}`,
    });
  } catch (error) {
    console.log('Rate limit exceeded for verifyEmail');
    return false;
  }

  // Validate and sanitize the verification code
  try {
    // First sanitize to prevent any HTML injection
    const sanitizedCode = sanitizeInput(unverifiedEmailVerificationCode);

    // Then validate the format
    const validationResult = verificationCodeSchema.safeParse(sanitizedCode);
    if (!validationResult.success) {
      console.log(
        'Verification code validation failed:',
        validationResult.error
      );
      return false;
    }

    // Use the validated and sanitized code
    unverifiedEmailVerificationCode = validationResult.data;
  } catch (error) {
    console.log('Verification code processing error:', error);
    return false;
  }

  let token;
  try {
    const cookieValue = (await cookies()).get(
      'emailPasswordAuthenticatedToken'
    )?.value;
    if (!cookieValue) {
      console.log(
        'No email password authentication token found for verification'
      );
      return false;
    }

    token = await jwt.verify(cookieValue, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });

    // Validate token structure
    const tokenValidation = tokenSchema.safeParse(token);
    if (!tokenValidation.success) {
      console.log('Token validation failed:', tokenValidation.error);
      return false;
    }

    token = tokenValidation.data;
  } catch (error) {
    console.log('Invalid token:', error);
    return false;
  }
  try {
    await rateLimiter.checkRateLimit({
      key: `user:email-verification:${token.userId}`,
    });
  } catch (error) {
    console.log('User rate limit exceeded for verification');
    return false;
  }
  const emailVerificationCodeRepository = new EmailVerificationCodeRepository({
    redisAdapter,
  });
  const emailVerificationCode = await emailVerificationCodeRepository.get({
    userId: token.userId,
  });
  if (!emailVerificationCode) {
    console.log('No verification code found');
    return false;
  }
  if (emailVerificationCode !== parseInt(unverifiedEmailVerificationCode, 10)) {
    console.log('Invalid verification code provided');
    return false;
  }
  await emailVerificationCodeRepository.delete({ userId: token.userId });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: token.userId });
  user.emails.find((emailInfo) => emailInfo.primary === true).verified = true;
  await userRepository.set({ userId: token.userId, user });
  const emailPasswordAuthenticatedToken = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      type: 'emailPasswordAuthenticated',
    },
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
  if (user.totpEnabled) {
    redirect('/verify-totp');
  } else {
    redirect('/register-totp');
  }
}
