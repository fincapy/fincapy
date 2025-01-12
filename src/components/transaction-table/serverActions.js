'use server';
import { RecategorizeTransactionService } from '@/backend/services/recategorizeTransactionService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { getSession } from '@auth0/nextjs-auth0';

const recategorizeTransaction = async ({
  planId,
  transactionId,
  newCategoryId,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const service = new RecategorizeTransactionService({
    tenantRepository: tenantRepository,
  });
  await service.execute({
    tenantId,
    planId,
    transactionId,
    newCategoryId,
  });
};

export { recategorizeTransaction };
