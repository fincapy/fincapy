'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RemoveUserService } from '@/backend/services/removeUserService';
import { ChangeUserRoleService } from '@/backend/services/changeUserRoleService';
import { ChangeUserNameService } from '@/backend/services/changeUserNameService';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { cookies } from 'next/headers';

const removeUser = async (email) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }

    const tenantId = session.tenantId;

    const tenantRepository = new TenantRepository({ redisAdapter });
    const auth0Adapter = new Auth0Adapter({ client: auth0Client });
    const removeUserService = new RemoveUserService({
      tenantRepository,
      auth0Adapter,
    });
    await removeUserService.execute({ tenantId, email });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const changeUserRole = async ({ email, role }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }

    const tenantId = session.tenantId;
    const tenantRepository = new TenantRepository({ redisAdapter });
    const changeUserRoleService = new ChangeUserRoleService({
      tenantRepository,
    });
    await changeUserRoleService.execute({ tenantId, email, role });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const changeUserName = async ({ email, name }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }

    const tenantId = session.tenantId;
    const tenantRepository = new TenantRepository({ redisAdapter });
    const changeUserNameService = new ChangeUserNameService({
      tenantRepository,
    });
    await changeUserNameService.execute({ tenantId, email, name });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export { removeUser, changeUserRole, changeUserName };
