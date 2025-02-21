import { EmailVerificationForm } from '@/components/email-verification-form';
import { headers, cookies } from 'next/headers';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { redirect } from 'next/navigation';
import { GalleryVerticalEnd } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';

export default async function VerifyEmailPage() {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.getSession({ cookies: cookies() });
  if (session) {
    redirect('/app');
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a
            href="#"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Fincapy
          </a>
          <div className="flex flex-col items-center justify-center -mt-4 gap-1">
            <div className="flex flex-col items-center gap-0 mb-2">
              <h2 className="text-2xl text-center font-semibold tracking-tight">
                Verify your email
              </h2>
            </div>
            <EmailVerificationForm />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
