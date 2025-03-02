'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { CreateUserService } from '@/backend/services/createUserService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';

const inviteUser = async ({ userId, email, role, name }) => {
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
    if (session.userRole !== 'owner') {
      return false;
    }

    const tenantId = session.tenantId;
    const auth0Adapter = new Auth0Adapter({ client: auth0Client });
    const transactionManager = new TransactionManager();
    const createUserService = new CreateUserService({
      transactionManager,
      auth0Adapter,
    });
    await createUserService.execute({
      tenantId,
      userId,
      email,
      role,
      name,
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

export { inviteUser };
