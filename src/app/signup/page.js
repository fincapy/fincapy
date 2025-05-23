import { PasswordSignupForm } from '@/components/sign-up-form';
import { AccessGate } from '@/components/access-gate';
import { headers } from 'next/headers';
import { LockKeyhole } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
  title: 'Fincapy | Sign up',
  description: 'Sign up for a Fincapy account.',
  alternates: {
    canonical: 'https://fincapy.com/signup',
  },
  openGraph: {
    title: 'Fincapy | Sign up',
    description: 'Sign up for a Fincapy account.',
    canonical: 'https://fincapy.com/signup',
  },
};

export default async function SignUpPage() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');
  const env = process.env.NODE_ENV;

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
  );
}
