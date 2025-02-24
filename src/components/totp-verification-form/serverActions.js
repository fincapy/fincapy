'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { RateLimiter } from '@/backend/adapters/rateLimiter';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import speakeasy from 'speakeasy';
import { redirect } from 'next/navigation';
import crypto from 'crypto';

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

export async function verifyTOTP(token) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new RateLimiter({ redisAdapter });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  // Check IP-based rate limit for TOTP attempts
  try {
    await rateLimiter.checkRateLimit({
      key: `ip:totp:${hashIp(ip)}`,
    });
  } catch (error) {
    return false;
  }

  if (isIpLimited) {
    throw new Error('Too many verification attempts. Please try again later.');
  }
  let jwtToken;
  try {
    jwtToken = await jwt.verify(
      (await cookies()).get('emailPasswordAuthenticatedToken').value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return false;
  }

  try {
    await rateLimiter.checkRateLimit({
      key: `user:totp:${jwtToken.userId}`,
    });
  } catch (error) {
    return false;
  }

  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: jwtToken.userId });

  if (!user || !user.totpSecret) {
    return false;
  }

  const isValid = speakeasy.totp.verify({
    secret: user.totpSecret,
    encoding: 'base32',
    token: token,
    window: 1,
  });

  if (!isValid) {
    return false;
  }

  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.createSession({
    userId: jwtToken.userId,
    tenantId: user.tenantId,
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
