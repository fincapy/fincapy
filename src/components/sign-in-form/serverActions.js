'use server';

import { cookies } from 'next/headers';
import {
  EmailPasswordAuthenticator,
  SessionManager,
} from '@/backend/adapters/auth';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import jwt from 'jsonwebtoken';

async function authenticateEmailPassword({ email, password }) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const userRepository = new UserRepository({ redisAdapter });
  const authenticator = new EmailPasswordAuthenticator({
    userRepository,
  });
  const sessionManager = new SessionManager({
    sessionRepository,
  });
  const user = await userRepository.getByEmail({ email });
  const result = await authenticator.authenticate({
    unauthenticatedPassword: password,
    password: user?.password,
  });
  if (result) {
    const partialAuthToken = jwt.sign(
      { userId: user.id, mfaMethod: user.mfa_method },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    cookies().set('mfa-token', partialAuthToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 10, // todo: fix
    });
    return true;
  }
  return false;
}

export { authenticateEmailPassword };
