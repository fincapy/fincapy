'use server';

import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function createAccount(name, email, password) {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const transactionManager = new TransactionManager({
      redisAdapter,
      tenantRepositoryFactory: TenantRepository,
      userRepositoryFactory: UserRepository,
    });
    const tenantRepository = new TenantRepository({
      redisAdapter,
    });
    const userRepository = new UserRepository({
      redisAdapter,
    });
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
      tenantRepository,
      userRepository,
    });
    const userId = crypto.randomUUID();
    const tenantId = crypto.randomUUID();
    await setupNewTenantService.execute({
      tenantId,
      userId,
      name,
      email,
      password,
      whitelistBilling: true,
    });
    const partialRegistrationToken = jwt.sign(
      { userId, tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    cookies().set('partial-registration-token', partialRegistrationToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10,
    });
    const emailVerificationCode = crypto.randomInt(100000, 999999);
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
      }
    );
    await emailVerificationCodeRepository.set({
      emailVerificationCode,
      userId,
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
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

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
  cookies().set('session-id', session.sessionId, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 3,
  });
  return true;
}
