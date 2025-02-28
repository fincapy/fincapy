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

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

export async function resendEmailVerificationCode() {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  try {
    await rateLimiter.checkRateLimit({
      key: `ip:email-verification-resend:${hashIp(ip)}`,
    });
  } catch (error) {
    console.log('Rate limit exceeded for resend:', error);
    return false;
  }

  let token;
  try {
    token = await jwt.verify(
      (await cookies()).get('emailPasswordAuthenticatedToken').value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    console.log('Invalid token:', error);
    return false;
  }

  if (!token || !token.userId) {
    return false;
  }

  try {
    await rateLimiter.checkRateLimit({
      key: `user:email-verification-resend:${token.userId}`,
    });
  } catch (error) {
    console.log('User rate limit exceeded for resend:', error);
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
    return false;
  }

  const primaryEmail = user.emails.find(
    (email) => email.primary === true
  )?.email;
  if (!primaryEmail) {
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
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';
  try {
    await rateLimiter.checkRateLimit({
      key: `ip:email-verification:${hashIp(ip)}`,
    });
  } catch (error) {
    console.log('error', error);
    return false;
  }
  let token;
  try {
    token = await jwt.verify(
      (await cookies()).get('emailPasswordAuthenticatedToken').value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return false;
  }
  if (!token) {
    return false;
  }
  try {
    await rateLimiter.checkRateLimit({
      key: `user:email-verification:${token.userId}`,
    });
  } catch (error) {
    return false;
  }
  const emailVerificationCodeRepository = new EmailVerificationCodeRepository({
    redisAdapter,
  });
  const emailVerificationCode = await emailVerificationCodeRepository.get({
    userId: token.userId,
  });
  if (!emailVerificationCode) {
    return false;
  }
  if (emailVerificationCode !== parseInt(unverifiedEmailVerificationCode, 10)) {
    return false;
  }
  await emailVerificationCodeRepository.delete({ userId: token.userId });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: token.userId });
  user.emails.find((emailInfo) => emailInfo.primary === true).verified = true;
  await userRepository.set({ userId: token.userId, user });
  const emailPasswordAuthenticatedToken = jwt.sign(
    { userId: user.id, tenantId: user.tenantId },
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
  if (user.totpEnabled) {
    redirect('/verify-totp');
  } else {
    redirect('/register-totp');
  }
}
