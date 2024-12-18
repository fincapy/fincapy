import { SetupNewTenantService } from '@/backend/services/setupNewTenantService';
import { PlanRepository } from '@/backend/adapters/repositories/PlanRepository';
import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';

export const POST = async (req) => {
  const tenantApiKey = process.env.TENANT_API_KEY;

  // if (req.headers.get('x-tenant-api-key') !== tenantApiKey) {
  //   return new Response(JSON.stringify({ message: 'Unauthorized' }), {
  //     status: 401,
  //   });
  // }

  const body = await req.json();
  const { tenantId } = body;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const planRepository = new PlanRepository({ tigrisAdapter });
  const service = new SetupNewTenantService({ planRepository });

  try {
    await service.execute({
      tenantId,
    });
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify({ message: 'Success' }), { status: 200 });
};
