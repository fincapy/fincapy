'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { getSession } from '@auth0/nextjs-auth0';
import { RemoveUserService } from '@/backend/services/removeUserService';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { CreateUserService } from '@/backend/services/createUserService';
const removeUser = async (email) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const auth0Adapter = new Auth0Adapter({ client: auth0Client });
  const removeUserService = new RemoveUserService({
    tenantRepository,
    auth0Adapter,
  });
  await removeUserService.execute({ tenantId, email });
};

const inviteUser = async ({ email, role, name }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const auth0Adapter = new Auth0Adapter({ client: auth0Client });
  const createUserService = new CreateUserService({
    tenantRepository,
    auth0Adapter,
  });
  await createUserService.execute({ tenantId, email, role, name });
};

const changeUserRole = async (email, role) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;
};

export { removeUser, inviteUser, changeUserRole };
