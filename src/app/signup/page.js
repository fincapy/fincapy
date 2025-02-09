import { PasswordSignupForm } from '@/components/sign-up-form';
import { headers } from 'next/headers';

export default function SignInPage() {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');

  return <PasswordSignupForm nonce={nonce} />;
}
