import Script from 'next/script';
import { headers } from 'next/headers';
import TermsOfServicePage from './terms-component';

export const metadata = {
  title: 'Fincapy | Terms of Service',
  alternates: {
    canonical: 'https://fincapy.com/terms-of-service',
  },
  description:
    'Terms of Service and conditions for using the Fincapy platform.',
  openGraph: {
    title: 'Fincapy | Terms of Service',
    description:
      'Terms of Service and conditions for using the Fincapy platform.',
  },
};

export default async function TermsOfService() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  return (
    <div className="py-2 h-full flex justify-center">
      <div className="w-[95%] max-w-4xl">
        <TermsOfServicePage nonce={nonce} />
      </div>
    </div>
  );
}
