'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import speakeasy from 'speakeasy';

export async function verifyTOTP(token) {
  let jwtToken;
  try {
    jwtToken = await jwt.verify(
      cookies().get('partial-session-token').value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return false;
  }

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: jwtToken.userId });

  if (!user || !user.totpSecret || !user.totpEnabled) {
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
    tenantId: jwtToken.tenantId,
    cookies: cookies(),
  });

  cookies().set('session-id', session.sessionId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 3,
  });

  return true;
}
