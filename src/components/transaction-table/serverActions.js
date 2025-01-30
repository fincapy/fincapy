'use server';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { getSession } from '@auth0/nextjs-auth0';
import { EditTransactionService } from '@/backend/services/editTransactionService';

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
    const session = await getSession();
    if (!session) {
      return false;
    }
    const tenantId = session.user.tenant_id;

    const redisAdapter = new RedisAdapter({ redisClient });
    const tenantRepository = new TenantRepository({ redisAdapter });
    const service = new EditTransactionService({
      tenantRepository,
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
