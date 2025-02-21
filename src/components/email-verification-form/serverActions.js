'use server';

import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifyEmail(unverifiedEmailVerificationCode) {
  let token;
  try {
    token = await jwt.verify(
      cookies().get('emailPasswordAuthenticatedToken').value,
      process.env.JWT_SECRET
    );
  } catch (error) {
    console.log('here? bad token?');
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
    console.log('here?');
    return false;
  }
  if (emailVerificationCode !== parseInt(unverifiedEmailVerificationCode, 10)) {
    console.log('what about here?');
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
  cookies().set(
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
