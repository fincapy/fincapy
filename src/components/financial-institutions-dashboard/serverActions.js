'use server';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { PubSubAdapter, pubSubClient } from '@/backend/adapters/pubsub';
import { CreatePlaidItemService } from '@/backend/services/createPlaidItemService';
import { UpdatePlaidItemService } from '@/backend/services/updatePlaidItemService';
import { DeletePlaidItemService } from '@/backend/services/deletePlaidItemService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { getSession } from '@auth0/nextjs-auth0';

const fetchLinkToken = async ({ institutionId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const [tenant, etag] = await tenantRepository.get({ tenantId });
  const plaidItem = tenant.plaidItems.find(
    (item) => item.institutionId === institutionId
  );
  const plaidAdapter = new PlaidAdapter(client);
  const linkToken = await plaidAdapter.createLinkToken({
    tenantId: tenantId,
    existingAccessToken: plaidItem?.accessToken,
  });
  return linkToken;
};

const createPlaidItem = async ({
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
  const tenantRepository = new TenantRepository({ tigrisAdapter });
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

const updatePlaidItem = async ({ institutionId, publicToken }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;
  const pubsubAdapter = new PubSubAdapter(pubSubClient);
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const plaidAdapter = new PlaidAdapter(client);
  const service = new UpdatePlaidItemService({
    tenantRepository,
    pubsubAdapter,
    plaidAdapter,
  });
  await service.execute({
    tenantId,
    institutionId,
    publicToken,
  });
  return true;
};

const deletePlaidItem = async ({ institutionId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;
  const plaidAdapter = new PlaidAdapter(client);
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ tigrisAdapter });
  const service = new DeletePlaidItemService({
    tenantRepository,
    plaidAdapter,
  });
  await service.execute({ tenantId, institutionId });
  return true;
};

export { fetchLinkToken, createPlaidItem, updatePlaidItem, deletePlaidItem };
