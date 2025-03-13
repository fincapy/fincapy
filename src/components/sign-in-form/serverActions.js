'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import {
  EmailPasswordAuthenticator,
  SessionManager,
} from '@/backend/adapters/auth';
import { RateLimiter } from '@/backend/adapters/rateLimiter';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redirect } from 'next/navigation';

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

// Input validation schemas
const emailPasswordSchema = z.object({
  email: z.string().email().trim().max(255),
  password: z.string().min(8).max(100),
});

const passwordResetSchema = z.object({
  email: z.string().email().trim().max(255),
});

// Sanitize function for string inputs
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });
}

async function authenticateEmailPassword(rawInput) {
  // Validate input
  const sanitizedInput = {
    email: sanitizeInput(rawInput.email),
    password: rawInput.password, // Don't sanitize password as it may contain special characters
  };

  let email;
  let password;
  try {
    const result = emailPasswordSchema.parse(sanitizedInput);
    email = result.email;
    password = result.password;
  } catch (error) {
    return false;
  }

  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';
  try {
    await rateLimiter.checkRateLimit({
      key: `ip:email-password:${hashIp(ip)}`,
    });
    await rateLimiter.checkRateLimit({
      key: `email:email-password:${hashEmail(email)}`,
    });
  } catch (error) {
    console.log('error', error);
    return false;
  }
  const userRepository = new UserRepository({ redisAdapter });
  const authenticator = new EmailPasswordAuthenticator({
    userRepository,
  });
  const user = await userRepository.getByEmail({ email });
  const result = await authenticator.authenticate({
    unauthenticatedPassword: password,
    password: user?.password,
  });
  if (result) {
    const emailVerified = user.emails.find(
      (emailInfo) => emailInfo.email === email
    )?.verified;
    const emailPasswordAuthenticatedToken = jwt.sign(
      {
        userId: user.id,
        mfaMethod: user.mfa_method,
        emailVerified: emailVerified,
        tenantId: user.tenantId,
        type: 'emailPasswordAuthenticated',
      },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    (await cookies()).set(
      'emailPasswordAuthenticatedToken',
      emailPasswordAuthenticatedToken,
      {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 10,
      }
    );

    if (!emailVerified) {
      const emailVerificationCode = crypto.randomInt(100000, 999999);
      const emailVerificationCodeRepository =
        new EmailVerificationCodeRepository({
          redisAdapter,
        });
      await emailVerificationCodeRepository.set({
        emailVerificationCode,
        userId: user.id,
        ttl: 60 * 10,
      });
      if (process.env.NODE_ENV === 'production') {
        const sesAdapter = new SESAdapter();
        await sesAdapter.sendEmail({
          to: email,
          subject: 'Verify your Fincapy account',
          text: `Your verification code is: ${emailVerificationCode}\n\nThis code will expire in 10 minutes.`,
        });
      } else {
        console.log('emailVerificationCode', emailVerificationCode);
      }
      redirect('/verify-email');
    }
    if (!user.totpEnabled) {
      redirect('/register-totp');
    }
    redirect('/verify-totp');
  }
  return false;
}

async function sendPasswordResetEmail(rawInput) {
  try {
    // Validate input
    const sanitizedInput = {
      email: sanitizeInput(rawInput.email),
    };

    const { email } = passwordResetSchema.parse(sanitizedInput);

    const redisAdapter = new RedisAdapter({ redisClient });
    const rateLimiter = new RateLimiter({ redisAdapter });

    // Get IP address from headers
    const headersList = await headers();
    const ip = headersList.get('fly-client-ip') || 'unknown-ip';
    try {
      await rateLimiter.checkRateLimit({
        key: `ip:password-reset:${hashIp(ip)}`,
      });
    } catch (error) {
      console.log('error', error);
      return false;
    }

    // Check if user exists
    const userRepository = new UserRepository({ redisAdapter });
    const user = await userRepository.getByEmail({ email });

    // Even if user doesn't exist, pretend we sent something for security
    if (!user) {
      return true;
    }

    // Generate a reset token
    const token = jwt.sign(
      { userId: user.id, type: 'resetPassword' },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
      }
    );
    const resetUrl = `${process.env.SITE_URL}/reset-password?token=${token}`;

    // Send email with the reset link
    if (process.env.NODE_ENV === 'production') {
      const sesAdapter = new SESAdapter();
      await sesAdapter.sendEmail({
        to: email,
        subject: 'Reset your Fincapy password',
        text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`,
      });
    } else {
      console.log('Password reset URL:', resetUrl);
    }

    return true;
  } catch (error) {
    console.error('Password reset validation error:', error);
    return false;
  }
}

export { authenticateEmailPassword, sendPasswordResetEmail };
