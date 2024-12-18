import { db } from '@/backend/adapters/database';
import { CreateTransactionService } from '@/backend/services/createTransaction';
import { TransactionRepository } from '@/backend/adapters/repositories/transactionRepository';
import { OpenaiAdapter } from '@/backend/adapters/openaiAdapter';

export const POST = async (req) => {
  const body = await req.json();
  const dataBuffer = Buffer.from(body.message.data, 'base64');
  const decodedData = dataBuffer.toString('utf-8');
  const message = JSON.parse(decodedData);
  const { tenantId } = message.payload;

  const openaiAdapter = new OpenaiAdapter();
  const transactionRepositoryFactory = TransactionRepository;

  const service = new CreateTransactionService({
    transactionRepositoryFactory,
    db,
    openaiAdapter,
  });

  try {
    await service.execute({
      tenantId,
      transactionCreatedMessage: message,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
