import { TriggerTransactionIngestForAllTenants } from '@/backend/services/triggerTransactionIngestForAllTenants';
import { TransactionManager } from '@/backend/adapters/transactionManager';

export const POST = async (req) => {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  const transactionManager = new TransactionManager();
  const service = new TriggerTransactionIngestForAllTenants({
    transactionManager,
  });

  try {
    await service.execute();
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
