import { PasswordSignupForm } from '@/components/sign-up-form';
import { AccessGate } from '@/components/access-gate';
import { headers } from 'next/headers';

export default function SignInPage() {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');

  return (
    <AccessGate nonce={nonce}>
      <PasswordSignupForm nonce={nonce} />
    </AccessGate>
  );
}
