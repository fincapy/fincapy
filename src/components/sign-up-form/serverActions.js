'use server';

import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function createAccount(email, password) {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
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
    await setupNewTenantService.execute({
      tenantId: crypto.randomUUID(),
      userId,
      email,
      password,
      whitelistBilling: true,
    });
    const partialRegistrationToken = jwt.sign(
      { userId },
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
    if (process.env.NODE_ENV !== 'production') {
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
      cookies().get('partial-registration-token'),
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
  if (emailVerificationCode !== unverifiedEmailVerificationCode) {
    return false;
  }
  await emailVerificationCodeRepository.delete({ userId: token.userId });
  return true;
}
