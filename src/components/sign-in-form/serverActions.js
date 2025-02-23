'use server';

import { cookies } from 'next/headers';
import {
  EmailPasswordAuthenticator,
  SessionManager,
} from '@/backend/adapters/auth';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redirect } from 'next/navigation';

async function authenticateEmailPassword({ email, password }) {
  const redisAdapter = new RedisAdapter({ redisClient });
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
