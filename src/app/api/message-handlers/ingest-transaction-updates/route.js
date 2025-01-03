import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { IngestTransactionUpdatesService } from '@/backend/services/ingestTransactionUpdatesService';
import { PubSubAdapter, pubSubClient } from '@/backend/adapters/pubsub';
import { OpenaiAdapter } from '@/backend/adapters/openaiAdapter';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const POST = async (req) => {
  await wait(1000);
  const body = await req.json();
  const dataBuffer = Buffer.from(body.message.data, 'base64');
  const decodedData = dataBuffer.toString('utf-8');
  const message = JSON.parse(decodedData);
  const { tenantId, institutionId } = message.payload;

  const pubsubAdapter = new PubSubAdapter(pubSubClient);
  const plaidAdapter = new PlaidAdapter(client);
  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
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
