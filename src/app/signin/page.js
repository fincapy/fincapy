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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10 bg-background">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center">
          <Image
            src="/capybara.png"
            alt="Fincapy"
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        <div className="flex flex-col items-center gap-0 mb-2">
          {/* <Suspense
            fallback={
              <Skeleton className="h-[282px] w-11/12 sm:w-96 bg-background" />
            }
          > */}
          <SignInForm />
          {/* </Suspense> */}
        </div>
      </div>
    </div>
  );
}
