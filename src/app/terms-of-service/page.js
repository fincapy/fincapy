import Script from 'next/script';
import { headers } from 'next/headers';

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
      <div
        name="termly-embed"
        data-id="aa41ec73-64aa-4e13-95bd-2098f1fa6048"
        className="w-[95%] max-w-4xl"
      ></div>

      <Script
        id="termly-script"
        src="https://app.termly.io/embed-policy.min.js"
        strategy="afterInteractive"
        nonce={nonce}
      />
    </div>
  );
}
