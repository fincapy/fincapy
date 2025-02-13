import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { parse } from 'date-fns';
import { cookies } from 'next/headers';

export const GET = async (req, res) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({
    redisAdapter,
  });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({
    req,
    cookies: cookies(),
  });
  const query = req.nextUrl.searchParams;
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const planId = query.get('planId');
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }
  const tenantId = session.tenantId;
  const tenantRepository = new TenantRepository({ redisAdapter });
  const tenant = await tenantRepository.get({ tenantId });
  const plan = tenant.plans.find((plan) => plan.planId === planId);
  plan.startDate = parse(startDate, 'yyyy-MM-dd', new Date());
  plan.endDate = parse(endDate, 'yyyy-MM-dd', new Date());
  return new Response(JSON.stringify(plan.toView()), { status: 200 });
};
