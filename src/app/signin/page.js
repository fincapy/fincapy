import { SignInForm } from '@/components/sign-in-form';
import { headers, cookies } from 'next/headers';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');
  const mfaToken = cookies().get('mfa-token');
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.getSession({ cookies: cookies() });
  if (session) {
    redirect('/app');
  }

  return <SignInForm nonce={nonce} mfaToken={mfaToken} />;
}
