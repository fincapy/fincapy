import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { getSession } from '@auth0/nextjs-auth0';
import { parse } from 'date-fns';

export const GET = async (req) => {
  const session = await getSession(req);
  const query = req.nextUrl.searchParams;
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const planId = query.get('planId');
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }
  const tenantId = session.user.tenant_id;
  const redisAdapter = new RedisAdapter({ redisClient });
  const tenantRepository = new TenantRepository({ redisAdapter });
  const tenant = await tenantRepository.get({ tenantId });
  const plan = tenant.plans.find((plan) => plan.planId === planId);
  plan.startDate = parse(startDate, 'yyyy-MM-dd', new Date());
  plan.endDate = parse(endDate, 'yyyy-MM-dd', new Date());
  return new Response(JSON.stringify(plan.toView()), { status: 200 });
};
