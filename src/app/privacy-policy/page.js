import Script from 'next/script';
import { headers } from 'next/headers';
import PrivacyPolicyPage from './privacy-component';

export const metadata = {
  title: 'Fincapy | Privacy Policy',
  alternates: {
    canonical: 'https://fincapy.com/privacy-policy',
  },
  description:
    'Privacy Policy and data handling practices for the Fincapy platform.',
  openGraph: {
    title: 'Fincapy | Privacy Policy',
    description:
      'Privacy Policy and data handling practices for the Fincapy platform.',
  },
};

export default async function PrivacyPolicy() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  return (
    <div className="py-2 h-full flex justify-center">
      <div className="w-[95%] max-w-4xl">
        <PrivacyPolicyPage nonce={nonce} />
      </div>
    </div>
  );
}
