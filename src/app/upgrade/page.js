import UpgradePage from '@/components/upgrade-page';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionManager = new SessionManager({
    sessionRepository: new SessionRepository({ redisAdapter }),
  });

  const cookiesList = await cookies();
  const session = await sessionManager.touchSession({
    cookies: cookiesList,
  });
  if (!session) {
    redirect('/signin');
  }

  return <UpgradePage />;
}
