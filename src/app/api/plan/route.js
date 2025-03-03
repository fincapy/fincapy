import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { parse, isValid } from 'date-fns';
import { cookies } from 'next/headers';

// Helper for validation
const validateInput = (input, pattern) => {
  if (!input) return false;
  return pattern.test(input);
};

export const GET = async (req, res) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({
    redisAdapter,
  });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({
    req,
    cookies: await cookies(),
  });
  
  // Validate session first
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }
  
  // Get and validate query parameters
  const query = req.nextUrl.searchParams;
  const startDate = query.get('startDate');
  const endDate = query.get('endDate');
  const planId = query.get('planId');
  
  // Validate required parameters
  if (!startDate || !endDate || !planId) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters' }),
      { status: 400 }
    );
  }
  
  // Validate date format (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!validateInput(startDate, datePattern) || !validateInput(endDate, datePattern)) {
    return new Response(
      JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
      { status: 400 }
    );
  }
  
  // Sanitize planId (alphanumeric values only plus hyphen and underscore)
  const planIdPattern = /^[a-zA-Z0-9-_]+$/;
  if (!validateInput(planId, planIdPattern)) {
    return new Response(
      JSON.stringify({ error: 'Invalid planId format' }),
      { status: 400 }
    );
  }
  console.log('session', session);
  const tenantId = session.tenantId;
  console.log('tenantId', tenantId);
  
  try {
    const tenantRepository = new TenantRepository({ redisAdapter });
    const tenant = await tenantRepository.get({ tenantId });
    
    if (!tenant) {
      return new Response(JSON.stringify({ error: 'Tenant not found' }), { 
        status: 404 
      });
    }
    
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    
    if (!plan) {
      return new Response(JSON.stringify({ error: 'Plan not found' }), { 
        status: 404 
      });
    }
    
    // Parse dates and validate they are valid
    const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
    const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());
    
    if (!isValid(parsedStartDate) || !isValid(parsedEndDate)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date values' }),
        { status: 400 }
      );
    }
    
    // Ensure start date is before end date
    if (parsedStartDate > parsedEndDate) {
      return new Response(
        JSON.stringify({ error: 'Start date must be before end date' }),
        { status: 400 }
      );
    }
    
    plan.startDate = parsedStartDate;
    plan.endDate = parsedEndDate;
    
    return new Response(JSON.stringify(plan.toView()), { status: 200 });
  } catch (error) {
    console.error('Error processing plan request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500 }
    );
  }
};
