import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { parse, isValid } from 'date-fns';
import { cookies } from 'next/headers';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';

// Define validation schemas using zod
const planIdSchema = z.string().regex(/^[a-zA-Z0-9-_]+$/, {
  message: "Plan ID must only contain alphanumeric characters, hyphens, and underscores"
});

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Date must be in YYYY-MM-DD format"
});

const queryParamsSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema,
  planId: planIdSchema
});

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
  
  // Get query parameters
  const query = req.nextUrl.searchParams;
  const params = {
    startDate: query.get('startDate'),
    endDate: query.get('endDate'),
    planId: query.get('planId')
  };
  
  // Validate parameters using zod
  const validationResult = queryParamsSchema.safeParse(params);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }),
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
  
  const { startDate, endDate, planId } = validationResult.data;
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
    
    // Sanitize the output to prevent XSS attacks
    const sanitizedPlanData = sanitizeHtml(JSON.stringify(plan.toView()), {
      allowedTags: [],       // Don't allow any HTML tags
      allowedAttributes: {}, // Don't allow any HTML attributes
      textFilter: function(text) {
        return text; // We're using this for JSON, so no additional text filtering
      }
    });
    
    return new Response(sanitizedPlanData, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'",
        'X-XSS-Protection': '1; mode=block'
      }
    });
  } catch (error) {
    console.error('Error processing plan request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'X-Content-Type-Options': 'nosniff'
        }
      }
    );
  }
};
