import { SignInForm } from '@/components/sign-in-form';
import { headers, cookies } from 'next/headers';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { redirect } from 'next/navigation';
import { GalleryVerticalEnd } from 'lucide-react';
import { LockKeyhole } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export const metadata = {
  title: 'Fincapy | Sign in',
  description: 'Sign in to your Fincapy account.',
  alternates: {
    canonical: 'https://fincapy.com/signin',
  },
  openGraph: {
    title: 'Fincapy | Sign in',
    description: 'Sign in to your Fincapy account.',
    canonical: 'https://fincapy.com/signin',
  },
};

export default async function SignInPage() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.getSession({ cookies: await cookies() });
  if (session) {
    redirect('/app');
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4 py-8 bg-background">
      <div className="w-full max-w-md mx-auto space-y-8">
        <div className="flex items-center justify-center">
          <Image
            src="/capybara.png"
            alt="Fincapy"
            width={128}
            height={128}
            className="rounded-full"
          />
        </div>
        <SignInForm />
      </div>
    </div>
  );
}
