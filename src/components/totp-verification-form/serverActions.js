'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import speakeasy from 'speakeasy';
import { redirect } from 'next/navigation';

export async function verifyTOTP(token) {
  let jwtToken;
  try {
    jwtToken = await jwt.verify(
      cookies().get('emailPasswordAuthenticatedToken').value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return false;
  }

  const redisAdapter = new RedisAdapter({ redisClient });
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
    cookies: cookies(),
  });
  const sessionToken = jwt.sign(
    { sessionId: session.sessionId },
    process.env.JWT_SECRET,
    { expiresIn: '3h' }
  );
  cookies().set('session-id', sessionToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 3,
  });
  redirect('/app');
}
