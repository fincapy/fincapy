'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RemoveUserService } from '@/backend/services/removeUserService';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { CreateUserService } from '@/backend/services/createUserService';
import { cookies } from 'next/headers';

const inviteUser = async ({ email, role, name }) => {
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
    const createUserService = new CreateUserService({
      tenantRepository,
      auth0Adapter,
    });
    await createUserService.execute({ tenantId, email, role, name });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

export { inviteUser };
