import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { PlaidItemRepository } from '@/backend/adapters/repositories/plaidItemRepository';
import { IngestNewTransactionsService } from '@/backend/services/ingestNewTransactionsService';
import { db } from '@/backend/adapters/database';

export const POST = async (req) => {
  const body = await req.json();
  const dataBuffer = Buffer.from(body.message.data, 'base64');
  const decodedData = dataBuffer.toString('utf-8');
  const message = JSON.parse(decodedData);
  const { tenantId, institutionId } = message.payload;

  const plaidAdapter = new PlaidAdapter(client);
  const service = new IngestNewTransactionsService({
    plaidAdapter,
    plaidItemRepositoryFactory: PlaidItemRepository,
    db,
  });

  try {
    await service.execute({ tenantId, institutionId });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
