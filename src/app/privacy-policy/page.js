import Script from 'next/script';
import { headers } from 'next/headers';

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
      <div
        name="termly-embed"
        data-id="adce23a1-078c-4dbf-9aeb-6df13709080d"
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
