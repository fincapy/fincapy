import { db } from '@/backend/adapters/database';
import { CreateTransactionService } from '@/backend/services/createTransaction';
import { TransactionRepository } from '@/backend/adapters/repositories/transactionRepository';
import { OpenaiAdapter } from '@/backend/adapters/repositories/openaiAdapter';
import { TransactionCreatedMessage } from '@/backend/adapters/messages';

export const GET = async (req) => {
  const openaiAdapter = new OpenaiAdapter();
  const transactionRepositoryFactory = TransactionRepository;

  const service = new CreateTransactionService({
    transactionRepositoryFactory,
    db,
    openaiAdapter,
  });

  const transactionCreatedMessage = new TransactionCreatedMessage({
    topicName: 'transaction.created',
    tenantId: '4444a3c5-c346-4077-9081-10f26cd2a18e',
    transactionId: '3',
    date: new Date().toISOString(),
    amount: 100,
    merchantName: 'Whole Foods',
    counterparties: [],
    category: 'Groceries',
    categoryConfidenceLevel: 0.9,
    pending: false,
    originalDescription: 'WHOLE FOODS',
    accountType: 'Checking',
    subAccountType: 'Checking',
  });

  const tenantId = '4444a3c5-c346-4077-9081-10f26cd2a18e';

  try {
    await service.execute({
      tenantId,
      transactionCreatedMessage,
    });
    return new Response(JSON.stringify({ message: 'Success!' }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }
};
