'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import {
  EmailPasswordAuthenticator,
  SessionManager,
} from '@/backend/adapters/auth';
import { AuthRateLimiter } from '@/backend/adapters/rateLimiter';
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
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new AuthRateLimiter({ redisAdapter });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  return await rateLimiter.withRateLimit(
    { ip, processId: 'authenticateEmailPassword', userId: rawInput.email },
    async () => {
      const sanitizedInput = {
        email: rawInput.email,
        password: rawInput.password, // Don't sanitize password as it may contain special characters
      };

      let email;
      let password;
      try {
        const result = emailPasswordSchema.parse(sanitizedInput);
        email = result.email;
        password = result.password;
      } catch (error) {
        console.log('Email/password validation failed');
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
          return () => redirect('/verify-email');
        }
        if (!user.totpEnabled) {
          return () => redirect('/register-totp');
        }
        return () => redirect('/verify-totp');
      }
      console.log('Invalid email/password combination');
      return false;
    }
  );
}

async function sendPasswordResetEmail(rawInput) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new AuthRateLimiter({ redisAdapter });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  return await rateLimiter.withRateLimit(
    { ip, processId: 'sendPasswordResetEmail', userId: rawInput.email },
    async () => {
      try {
        // Validate input
        const sanitizedInput = {
          email: sanitizeInput(rawInput.email),
        };

        let email;
        try {
          const result = passwordResetSchema.parse(sanitizedInput);
          email = result.email;
        } catch (error) {
          console.log('Invalid email format for password reset');
          return false;
        }

        // Check if user exists
        const userRepository = new UserRepository({ redisAdapter });
        const user = await userRepository.getByEmail({ email });

        // Generate a reset token whether user exists or not
        // This ensures consistent timing to prevent timing attacks
        const userId = user ? user.id : 'nonexistent-user';
        const token = jwt.sign(
          { userId: userId, type: 'resetPassword' },
          process.env.JWT_SECRET,
          {
            expiresIn: '1h',
            algorithm: 'HS256',
          }
        );
        const resetUrl = `${process.env.SITE_URL}/reset-password?token=${token}`;

        // Only proceed with actual email sending if user exists
        if (user && process.env.NODE_ENV === 'production') {
          const sesAdapter = new SESAdapter();
          await sesAdapter.sendEmail({
            to: email,
            subject: 'Reset your Fincapy password',
            text: `Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.`,
          });
        } else if (process.env.NODE_ENV !== 'production') {
          // In development, log the URL (or a message that we would have sent one)
          if (user) {
            console.log('Password reset URL:', resetUrl);
          } else {
            console.log('Would have sent password reset URL if user existed');
          }
        }

        return true;
      } catch (error) {
        console.log('Password reset request failed');
        return false;
      }
    }
  );
}

export { authenticateEmailPassword, sendPasswordResetEmail };
