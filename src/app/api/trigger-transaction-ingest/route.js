import { TriggerTransactionIngestForAllTenants } from '@/backend/services/triggerTransactionIngestForAllTenants';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { PubSubAdapter, pubSubClient } from '@/backend/adapters/pubsub';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';

export const POST = async (req) => {
  if (process.env.NODE_ENV !== 'development') {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const pubsubAdapter = new PubSubAdapter(pubSubClient);
  const service = new TriggerTransactionIngestForAllTenants({
    tenantRepository,
    pubsubAdapter,
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
