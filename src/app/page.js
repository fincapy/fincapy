import Home from '@/components/landing-page';
import { cookies } from 'next/headers';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.getSession({ cookies: await cookies() });

  if (session) {
    redirect('/app');
  }

  return <Home />;
}
