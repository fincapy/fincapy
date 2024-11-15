import CreateTenantService from '@/backend/services/tenant/createTenantService';
import TenantRepository from '@/backend/adapters/repositories/tenantRepository';
import { db } from '@/backend/adapters/database';

export const POST = async (req) => {
  const tenantApiKey = process.env.TENANT_API_KEY;

  if (req.headers.get('x-tenant-api-key') !== tenantApiKey) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  const body = await req.json();
  const { tenantId } = body;

  const service = new CreateTenantService({
    tenantRepositoryFactory: TenantRepository,
    db,
  });

  try {
    await service.execute(tenantId);
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
