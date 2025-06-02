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
        <PasswordSignupForm />
      </div>
    </div>
  );
}
