import HouseSavingsCalculatorClient from './calculator-client';
import { headers } from 'next/headers';

// Metadata for the page
export const metadata = {
  title: 'How Long to Save for a House Calculator - Fincapy Blog',
  description:
    'Calculate how long it will take to save for your dream home based on your target monthly mortgage payment. Free house savings calculator with current mortgage rates.',
  metadataBase: new URL('https://fincapy.com'),
  alternates: {
    canonical:
      'https://fincapy.com/blog/how-long-to-save-for-a-house-calculator',
  },
  openGraph: {
    title: 'How Long to Save for a House Calculator',
    description:
      'Calculate how long it will take to save for your dream home based on your target monthly mortgage payment. Free house savings calculator with current mortgage rates.',
    type: 'article',
    url: 'https://fincapy.com/blog/how-long-to-save-for-a-house-calculator',
  },
};

// JSON-LD structured data for Google
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['WebApplication', 'SoftwareApplication'],
  name: 'House Savings Calculator - How Long to Save for a Home',
  description:
    'Calculate how long it will take to save for your dream home based on your target monthly mortgage payment. Interactive calculator with current mortgage rates.',
  url: 'https://fincapy.com/blog/how-long-to-save-for-a-house-calculator',
  applicationCategory: 'FinanceApplication',
  applicationSubCategory: 'Calculator',
  operatingSystem: 'Web Browser',
  browserRequirements: 'Requires JavaScript',
  inLanguage: 'en-US',
  isAccessibleForFree: true,
  keywords:
    'house savings calculator, home buying calculator, mortgage calculator, down payment calculator, savings timeline calculator, home affordability calculator',
  author: {
    '@type': 'Organization',
    name: 'Fincapy',
    url: 'https://fincapy.com',
  },
  creator: {
    '@type': 'Organization',
    name: 'Fincapy',
    url: 'https://fincapy.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Fincapy',
    url: 'https://fincapy.com',
  },
  datePublished: '2024-12-23',
  dateModified: '2024-12-23',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
  },
  featureList: [
    'Calculate savings timeline for home purchase',
    'Determine required down payment for target monthly payment',
    'Use current mortgage interest rates',
    'Interactive form with real-time validation',
    'Detailed breakdown of loan calculations',
    'Mobile-friendly responsive design',
  ],
  softwareRequirements: 'Modern web browser with JavaScript enabled',
  targetAudience: {
    '@type': 'Audience',
    audienceType: 'Home Buyers',
  },
  mainEntity: {
    '@type': 'WebApplication',
    name: 'House Savings Timeline Calculator',
    description:
      'Interactive calculator to determine how long you need to save for a house down payment',
    applicationCategory: 'FinanceApplication',
  },
  about: [
    {
      '@type': 'Thing',
      name: 'Home Buying',
    },
    {
      '@type': 'Thing',
      name: 'Mortgage Planning',
    },
    {
      '@type': 'Thing',
      name: 'Savings Goals',
    },
    {
      '@type': 'Thing',
      name: 'Financial Planning',
    },
  ],
};

export default async function HouseSavingsCalculatorPage() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HouseSavingsCalculatorClient />
    </>
  );
}
