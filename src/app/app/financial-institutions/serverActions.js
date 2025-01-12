'use server';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { PubSubAdapter, pubSubClient } from '@/backend/adapters/pubsub';
import { CreatePlaidItemService } from '@/backend/services/createPlaidItemService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { getSession } from '@auth0/nextjs-auth0';

const fetchLinkToken = async () => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;
  const plaidAdapter = new PlaidAdapter(client);
  const linkToken = await plaidAdapter.createLinkToken({ tenantId: tenantId });
  return linkToken;
};

const exchangePublicToken = async ({
  publicToken,
  institutionId,
  institutionName,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;
  const plaidAdapter = new PlaidAdapter(client);
  const pubsubAdapter = new PubSubAdapter(pubSubClient);
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const service = new CreatePlaidItemService({
    tenantRepository,
    pubsubAdapter,
    plaidAdapter,
  });

  await service.execute({
    tenantId,
    institutionId,
    institutionName,
    publicToken,
  });
  return true;
};

export { fetchLinkToken, exchangePublicToken };
