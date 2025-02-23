'use server';

import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { redirect } from 'next/navigation';

export async function createAccount(name, email, password, accessCode) {
  try {
    if (
      accessCode !== process.env.NEXT_PUBLIC_SITE_ACCESS_CODE &&
      process.env.NODE_ENV === 'production'
    ) {
      return false;
    }
    const redisAdapter = new RedisAdapter({ redisClient });
    const transactionManager = new TransactionManager();
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
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
    (await cookies()).set('emailPasswordAuthenticatedToken', partialRegistrationToken, {
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
  } catch (error) {
    return false;
  }
  redirect('/verify-email');
}
