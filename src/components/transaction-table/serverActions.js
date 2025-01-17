'use server';
import { RecategorizeTransactionService } from '@/backend/services/recategorizeTransactionService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { getSession } from '@auth0/nextjs-auth0';

const recategorizeTransaction = async ({
  planId,
  transactionId,
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
    const service = new RecategorizeTransactionService({
      tenantRepository: tenantRepository,
    });
    await service.execute({
      tenantId,
      planId,
      transactionId,
      newCategoryId,
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export { recategorizeTransaction };
