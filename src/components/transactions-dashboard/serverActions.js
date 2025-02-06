'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { CreateTransactionService } from '@/backend/services/createTransactionService';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { cookies } from 'next/headers';

const createTransaction = async ({
  planId,
  categoryId,
  date,
  description,
  status,
  type,
  amount,
}) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({ cookies: cookies() });
  if (!session) return false;
  const tenantRepository = new TenantRepository({ redisAdapter });
  const createTransactionService = new CreateTransactionService({
    tenantRepository,
  });
  const tenantId = session.tenantId;
  try {
    await createTransactionService.execute({
      tenantId,
      planId,
      categoryId,
      date,
      description,
      status,
      type,
      amount,
    });
    return true;
  } catch (error) {
    console.log('error', error);
    return false;
  }
};

export { createTransaction };
