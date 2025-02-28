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

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

export async function generateTOTPSecret() {
  const secret = speakeasy.generateSecret({
    name: 'Fincapy',
    issuer: 'Fincapy',
  });

  return {
    otpauthUrl: secret.otpauth_url,
    secret: secret.base32,
  };
}

export async function verifyAndSaveTOTP(token, secret) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';
  try {
    await rateLimiter.checkRateLimit({
      key: `ip:totp-registration:${hashIp(ip)}`,
    });
  } catch (error) {
    console.log('here?');
    return false;
  }

  const isValid = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1,
  });

  if (!isValid) {
    return false;
  }

  let jwtToken;
  const awaitingMFASetupAfterSignupCookie = (await cookies()).get(
    'emailPasswordAuthenticatedToken'
  );
  if (!awaitingMFASetupAfterSignupCookie) {
    return false;
  }
  try {
    jwtToken = await jwt.verify(
      awaitingMFASetupAfterSignupCookie.value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    console.log('what about here?');
    return false;
  }

  try {
    await rateLimiter.checkRateLimit({
      key: `user:totp-registration:${jwtToken.userId}`,
    });
  } catch (error) {
    return false;
  }

  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: jwtToken.userId });

  if (!user) {
    return false;
  }

  user.totpSecret = secret;
  user.totpEnabled = true;
  await userRepository.set({ userId: user.id, user });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.createSession({
    userId: jwtToken.userId,
    tenantId: jwtToken.tenantId,
    cookies: await cookies(),
  });
  const sessionToken = jwt.sign(
    { sessionId: session.sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '3h' }
  );
  (await cookies()).set('session-id', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 3,
  });
  redirect('/app');
}
