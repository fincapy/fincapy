'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RemoveUserService } from '@/backend/services/removeUserService';
import { ChangeUserRoleService } from '@/backend/services/changeUserRoleService';
import { ChangeUserNameService } from '@/backend/services/changeUserNameService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { cookies } from 'next/headers';

const removeUser = async ({ userId }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }

    const tenantId = session.tenantId;

    const transactionManager = new TransactionManager();
    const auth0Adapter = new Auth0Adapter({ client: auth0Client });
    const removeUserService = new RemoveUserService({
      transactionManager,
      auth0Adapter,
    });
    await removeUserService.execute({ tenantId, userId });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const changeUserRole = async ({ userId, role }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }

    const tenantId = session.tenantId;
    const transactionManager = new TransactionManager();
    const changeUserRoleService = new ChangeUserRoleService({
      transactionManager,
    });
    await changeUserRoleService.execute({ tenantId, userId, role });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const changeUserName = async ({ userId, name }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }

    const tenantId = session.tenantId;
    const transactionManager = new TransactionManager();
    const changeUserNameService = new ChangeUserNameService({
      transactionManager,
    });
    await changeUserNameService.execute({ tenantId, userId, name });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export { removeUser, changeUserRole, changeUserName };
