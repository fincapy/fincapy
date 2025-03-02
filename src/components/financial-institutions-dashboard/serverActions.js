'use server';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { CreatePlaidItemService } from '@/backend/services/createPlaidItemService';
import { UpdatePlaidItemService } from '@/backend/services/updatePlaidItemService';
import { DeletePlaidItemService } from '@/backend/services/deletePlaidItemService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { cookies } from 'next/headers';
import { TransactionManager } from '@/backend/adapters/transactionManager';

const fetchLinkToken = async ({ institutionId }) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({
    cookies: await cookies(),
  });
  if (!session) {
    return false;
  }
  if (session.userRole === 'viewer') {
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
  plaidItemId,
  institutionId,
  institutionName,
}) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      return false;
    }
    if (session.userRole === 'viewer') {
      return false;
    }
    const tenantId = session.tenantId;
    const userId = session.userId;
    const plaidAdapter = new PlaidAdapter(client);
    const transactionManager = new TransactionManager();
    const service = new CreatePlaidItemService({
      transactionManager,
      plaidAdapter,
    });

    await service.execute({
      userId,
      plaidItemId,
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

const updatePlaidItem = async ({ plaidItemId, publicToken }) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({
    cookies: await cookies(),
  });
  if (!session) {
    return false;
  }
  if (session.userRole === 'viewer') {
    return false;
  }
  const tenantId = session.tenantId;
  const transactionManager = new TransactionManager();
  const plaidAdapter = new PlaidAdapter(client);
  const service = new UpdatePlaidItemService({
    transactionManager,
    plaidAdapter,
  });
  await service.execute({
    tenantId,
    plaidItemId,
    publicToken,
  });
  return true;
};

const deletePlaidItem = async ({ plaidItemId }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      return false;
    }
    if (session.userRole === 'viewer') {
      return false;
    }
    const tenantId = session.tenantId;
    const plaidAdapter = new PlaidAdapter(client);
    const transactionManager = new TransactionManager();
    const service = new DeletePlaidItemService({
      transactionManager,
      plaidAdapter,
    });
    await service.execute({ tenantId, plaidItemId });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

export { fetchLinkToken, createPlaidItem, updatePlaidItem, deletePlaidItem };
