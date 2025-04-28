import { headers } from 'next/headers';
import Image from 'next/image';
import UpgradePage from '@/components/upgrade-page';

export default async function SignUpPage() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');
  const env = process.env.NODE_ENV;

  return <UpgradePage />;
}
