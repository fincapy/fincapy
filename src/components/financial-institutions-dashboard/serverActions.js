'use server';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { PubSubAdapter, pubSubClient } from '@/backend/adapters/pubsub';
import { CreatePlaidItemService } from '@/backend/services/createPlaidItemService';
import { UpdatePlaidItemService } from '@/backend/services/updatePlaidItemService';
import { DeletePlaidItemService } from '@/backend/services/deletePlaidItemService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { cookies } from 'next/headers';

const fetchLinkToken = async ({ institutionId }) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({ cookies: cookies() });
  if (!session) {
    return false;
  }
  const tenantId = session.tenantId;
  const tenantRepository = new TenantRepository({ redisAdapter });
  const tenant = await tenantRepository.get({ tenantId });
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
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }
    const tenantId = session.tenantId;
    const plaidAdapter = new PlaidAdapter(client);
    const pubsubAdapter = new PubSubAdapter(pubSubClient);
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
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

const updatePlaidItem = async ({ institutionId, publicToken }) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({ cookies: cookies() });
  if (!session) {
    return false;
  }
  const tenantId = session.tenantId;
  const pubsubAdapter = new PubSubAdapter(pubSubClient);
  const tenantRepository = new TenantRepository({ redisAdapter });
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
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }
    const tenantId = session.tenantId;
    const plaidAdapter = new PlaidAdapter(client);
    const tenantRepository = new TenantRepository({ redisAdapter });
    const service = new DeletePlaidItemService({
      tenantRepository,
      plaidAdapter,
    });
    await service.execute({ tenantId, institutionId });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

export { fetchLinkToken, createPlaidItem, updatePlaidItem, deletePlaidItem };
