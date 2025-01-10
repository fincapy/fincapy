import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';

export const POST = async (req) => {
  const tenantApiKey = process.env.TENANT_API_KEY;

  if (req.headers.get('x-api-key') !== tenantApiKey) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const body = await req.json();
    const { tenantId, email, name } = body;
    const tigrisAdapter = new TigrisAdapter({ client: s3client });
    const tenantRepository = new TenantRepository({ tigrisAdapter });
    const service = new SetupNewTenantService({ tenantRepository });
    await service.execute({
      tenantId,
      email,
      name,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
