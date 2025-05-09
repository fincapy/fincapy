// This is now a server component (no 'use client' directive)
import WhyTrustUsContent from './why-trust-us-content';

export const metadata = {
  title: 'Fincapy | Why Trust Us',
  description:
    'Learn how Fincapy prioritizes your security and privacy with encryption, 2FA, secure infrastructure, and transparent business practices.',
  keywords:
    'financial security, data privacy, budgeting app security, financial privacy, secure personal finance',
  alternates: {
    canonical: 'https://fincapy.com/why-trust-us',
  },
  openGraph: {
    title: 'Fincapy | Why Trust Us',
    description:
      'Learn how Fincapy prioritizes your security and privacy with encryption, 2FA, secure infrastructure, and transparent business practices.',
    url: 'https://fincapy.com/why-trust-us',
    siteName: 'Fincapy',
    locale: 'en_US',
    type: 'website',
  },
};

export default function WhyTrustUs() {
  return <WhyTrustUsContent />;
}
