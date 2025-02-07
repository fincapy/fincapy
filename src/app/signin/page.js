import { SignInForm } from '@/components/sign-in-form';
import { headers } from 'next/headers';

export default function SignInPage() {
  const headersList = headers();
  const nonce = headersList.get('x-nonce');

  return <SignInForm nonce={nonce} />;
}
