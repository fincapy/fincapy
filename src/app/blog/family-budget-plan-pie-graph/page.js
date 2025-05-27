import FamilyBudgetPieChartClient from './pie-chart-client';
import { headers } from 'next/headers';

// Metadata for the page
export const metadata = {
  title: 'Family Budget Plan Pie Chart Generator - Fincapy Blog',
  description:
    'Create interactive pie charts for your family budget plan. Enter up to 100 categories and expenses to visualize your spending breakdown instantly.',
  metadataBase: new URL('https://fincapy.com'),
  alternates: {
    canonical: 'https://fincapy.com/blog/family-budget-plan-pie-graph',
  },
  openGraph: {
    title: 'Family Budget Plan Pie Chart Generator',
    description:
      'Create interactive pie charts for your family budget plan. Enter up to 100 categories and expenses to visualize your spending breakdown instantly.',
    type: 'article',
    url: 'https://fincapy.com/blog/family-budget-plan-pie-graph',
  },
};

// JSON-LD structured data for Google
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': ['WebApplication', 'SoftwareApplication'],
  name: 'Family Budget Pie Chart Generator - Visual Budget Planning',
  description:
    'Create interactive pie charts for your family budget plan. Enter categories and expenses to visualize spending breakdown with dynamic charts.',
  url: 'https://fincapy.com/blog/family-budget-plan-pie-graph',
  applicationCategory: 'FinanceApplication',
  applicationSubCategory: 'BudgetingTool',
  operatingSystem: 'Web Browser',
  browserRequirements: 'Requires JavaScript',
  inLanguage: 'en-US',
  isAccessibleForFree: true,
  keywords:
    'budget pie chart, family budget planner, expense visualization, budget breakdown chart, spending categories chart, budget planning tool',
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
    'Create interactive pie charts for budget visualization',
    'Add up to 100 budget categories and expenses',
    'Real-time chart updates as you type',
    'Automatic percentage calculations',
    'Color-coded spending categories',
    'Mobile-friendly responsive design',
    'Export and save chart functionality',
  ],
  softwareRequirements: 'Modern web browser with JavaScript enabled',
  targetAudience: {
    '@type': 'Audience',
    audienceType: 'Families and Budget Planners',
  },
  mainEntity: {
    '@type': 'WebApplication',
    name: 'Budget Pie Chart Visualizer',
    description:
      'Interactive tool to create visual pie charts for family budget planning',
    applicationCategory: 'FinanceApplication',
  },
  about: [
    {
      '@type': 'Thing',
      name: 'Budget Planning',
    },
    {
      '@type': 'Thing',
      name: 'Expense Tracking',
    },
    {
      '@type': 'Thing',
      name: 'Financial Visualization',
    },
    {
      '@type': 'Thing',
      name: 'Family Finance',
    },
  ],
};

export default async function FamilyBudgetPieChartPage() {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');

  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FamilyBudgetPieChartClient />
    </>
  );
}
