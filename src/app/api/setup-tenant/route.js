import { db } from '@/backend/adapters/database';
import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { SpendingCategoryRepository } from '@/backend/adapters/repositories/spendingCategoryRepository';
import { SpendingSubcategoryRepository } from '@/backend/adapters/repositories/spendingSubcategoryRepository';

export const POST = async (req) => {
  const tenantApiKey = process.env.TENANT_API_KEY;

  if (req.headers.get('x-tenant-api-key') !== tenantApiKey) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  const body = await req.json();
  const { tenantId, spendingCategoryId, spendingSubcategoryId } = body;

  const service = new SetupNewTenantService({
    spendingCategoryRepositoryFactory: SpendingCategoryRepository,
    spendingSubcategoryRepositoryFactory: SpendingSubcategoryRepository,
    db,
  });

  try {
    await service.execute({
      tenantId,
      spendingCategoryId,
      spendingSubcategoryId,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
