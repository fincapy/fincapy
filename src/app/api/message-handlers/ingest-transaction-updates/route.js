import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { IngestTransactionUpdatesService } from '@/backend/services/ingestTransactionUpdatesService';
import { OpenaiAdapter } from '@/backend/adapters/openaiAdapter';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';

export const POST = async (req) => {
  const body = await req.json();
  const dataBuffer = Buffer.from(body.message.data, 'base64');
  const decodedData = dataBuffer.toString('utf-8');
  const message = JSON.parse(decodedData);
  const { tenantId, institutionId } = message.payload;

  const plaidAdapter = new PlaidAdapter(client);
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const openaiAdapter = new OpenaiAdapter();
  const service = new IngestTransactionUpdatesService({
    plaidAdapter,
    tenantRepository,
    openaiAdapter,
    pubsubAdapter,
  });

  try {
    await service.execute({ tenantId, institutionId });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
