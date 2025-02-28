import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const GET = async (req, res) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({
    redisAdapter,
  });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.getSession({
    req,
    cookies: await cookies(),
  });
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
    });
  }
  sessionManager.deleteSession({
    sessionId: session.sessionId,
    cookies: await cookies(),
  });
  redirect('/');
};
