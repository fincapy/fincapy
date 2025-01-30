'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { CreateTransactionService } from '@/backend/services/createTransactionService';
import { getSession } from '@auth0/nextjs-auth0';

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
  const tenantRepository = new TenantRepository({ redisAdapter });
  const createTransactionService = new CreateTransactionService({
    tenantRepository,
  });
  const session = await getSession();
  const tenantId = session.user.tenant_id;
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
