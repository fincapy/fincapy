'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { EditTransactionService } from '@/backend/services/editTransactionService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';

const editTransaction = async ({
  planId,
  transactionId,
  categoryId,
  subcategoryId,
  date,
  description,
  status,
  type,
  amount,
  newCategoryId,
}) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      return false;
    }
    if (session.userRole === 'viewer') {
      return false;
    }
    const tenantId = session.tenantId;

    const transactionManager = new TransactionManager();
    const service = new EditTransactionService({
      transactionManager,
    });
    await service.execute({
      tenantId,
      planId,
      transactionId,
      categoryId,
      subcategoryId,
      date,
      description,
      status,
      type,
      amount,
      newCategoryId,
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export { editTransaction };
