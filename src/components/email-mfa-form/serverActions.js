'use server';

import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function verifyEmail(unverifiedEmailVerificationCode) {
  let token;
  try {
    token = await jwt.verify(
      cookies().get('partial-registration-token').value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    return false;
  }
  if (!token) {
    return false;
  }
  const redisAdapter = new RedisAdapter({ redisClient });
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
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.createSession({
    userId: token.userId,
    tenantId: token.tenantId,
    cookies: cookies(),
  });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId: token.userId });
  user.emailVerified = true;
  await userRepository.set({ userId: token.userId, user });
  cookies().set('session-id', session.sessionId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 3,
  });
  return true;
}
