'use server';

import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';

export async function createAccount(email, password) {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const transactionManager = new TransactionManager({
      redisAdapter,
      tenantRepositoryFactory: TenantRepository,
      userRepositoryFactory: UserRepository,
    });
    const tenantRepository = new TenantRepository({
      redisAdapter,
    });
    const userRepository = new UserRepository({
      redisAdapter,
    });
    const setupNewTenantService = new SetupNewTenantService({
      transactionManager,
      tenantRepository,
      userRepository,
    });
    await setupNewTenantService.execute({
      tenantId: crypto.randomUUID(),
      email,
      password,
      whitelistBilling: true,
    });
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}
