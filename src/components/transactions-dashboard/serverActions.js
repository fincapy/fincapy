'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { CreateTransactionService } from '@/backend/services/createTransactionService';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';

const createTransaction = async ({
  planId,
  categoryId,
  date,
  description,
  status,
  type,
  amount,
  transactionId,
}) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({
    cookies: await cookies(),
  });
  if (!session) return false;
  if (session.userRole === 'viewer') {
    return false;
  }
  const transactionManager = new TransactionManager();
  const createTransactionService = new CreateTransactionService({
    transactionManager,
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
      transactionId,
    });
    return true;
  } catch (error) {
    console.log('error', error);
    return false;
  }
};

export { createTransaction };
