'use server';
import { RecategorizeTransactionService } from '@/backend/services/recategorizeTransactionService';
import { TransactionRepository } from '@/backend/adapters/repositories/transactionRepository';
import { RecategorizationLogRepository } from '@/backend/adapters/repositories/recategorizationLogRepository';
import { db } from '@/backend/adapters/database';
import { getSession } from '@auth0/nextjs-auth0';

const recategorizeTransaction = async ({ transactionId, categoryId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new RecategorizeTransactionService({
    transactionRepositoryFactory: TransactionRepository,
    recategorizeLogRepositoryFactory: RecategorizationLogRepository,
    db,
  });
  await service.execute({
    tenantId,
    transactionId,
    categoryId,
  });
};

export { recategorizeTransaction };
