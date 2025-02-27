import { PasswordSignupForm } from '@/components/sign-up-form';
import { AccessGate } from '@/components/access-gate';
import { headers } from 'next/headers';
import { LockKeyhole } from 'lucide-react';

export default async function SignUpPage() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');
  const env = process.env.NODE_ENV;

  return (
    <>
      {env === 'production' ? (
        <AccessGate>
          <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
              <a
                href="#"
                className="flex items-center gap-2 self-center font-medium"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <LockKeyhole className="size-4" />
                </div>
                Fincapy
              </a>
              <div className="flex flex-col items-center justify-center -mt-4 gap-1">
                <div className="flex flex-col items-center gap-0 mb-2">
                  <h2 className="text-2xl text-center font-semibold tracking-tight">
                    Welcome!
                  </h2>
                </div>
                <PasswordSignupForm />
              </div>
            </div>
          </div>
        </AccessGate>
      ) : (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <a
              href="#"
              className="flex items-center gap-2 self-center font-medium"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <LockKeyhole className="size-4" />
              </div>
              Fincapy
            </a>
            <div className="flex flex-col items-center justify-center -mt-4 gap-1">
              <div className="flex flex-col items-center gap-0 mb-2">
                <h2 className="text-2xl text-center font-semibold tracking-tight">
                  Welcome!
                </h2>
              </div>
              <PasswordSignupForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
