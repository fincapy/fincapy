'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
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

async function authenticateEmailPassword({ email, password }) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });

  // Get IP address from headers
  const headersList = headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  // Check rate limits with initial fixed window, then exponential backoff after threshold
  const isIpLimited = await rateLimiter.isRateLimited({
    key: `ip:${hashIp(ip)}`,
    limit: 10,
    windowInSeconds: 60,
    backoffThreshold: 10
  });

  const isEmailLimited = await rateLimiter.isRateLimited({
    key: `email:${hashEmail(email)}`,
    limit: 10,
    windowInSeconds: 60,
    backoffThreshold: 10
  });

  if (isIpLimited || isEmailLimited) {
    const ipAttempts = await rateLimiter.getAttempts(`ip:${hashIp(ip)}`);
    const emailAttempts = await rateLimiter.getAttempts(`email:${hashEmail(email)}`);
    
    if (Math.max(ipAttempts, emailAttempts) <= 10) {
      throw new Error('Too many login attempts. Please try again in 1 minute.');
    } else {
      const attemptsOverThreshold = Math.max(ipAttempts, emailAttempts) - 10;
      const backoffMinutes = Math.min(
        Math.pow(2, Math.floor(attemptsOverThreshold / 10)),
        1440 // Max 24 hours
      );
      throw new Error(`Too many login attempts. Please try again in ${backoffMinutes} minutes.`);
    }
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
  const emailVerified = user.emails.find(
    (emailInfo) => emailInfo.email === email
  )?.verified;
  if (result) {
    const emailPasswordAuthenticatedToken = jwt.sign(
      {
        userId: user.id,
        mfaMethod: user.mfa_method,
        emailVerified: emailVerified,
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

export { authenticateEmailPassword };
