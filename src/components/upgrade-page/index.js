'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function UpgradePage() {
  // Define price IDs (these would come from your Stripe account)
  const PRICE_IDS = {
    MONTHLY: 'price_monthly123',
    ANNUAL: 'price_annual456',
  };

  const handleUpgrade = (priceId) => {
    fetch(`/api/checkout?priceId=${priceId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Upgrade Your Plan
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground">
            Choose the plan that works best for your financial journey.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
          {/* Monthly Plan */}
          <Card className="flex flex-col p-6 border border-gray-300">
            <div className="mb-4 text-center">
              <h3 className="text-2xl font-bold">Premium Monthly</h3>
              <p className="text-muted-foreground">Automate everything</p>
            </div>
            <div className="mb-4 text-center">
              <span className="text-4xl font-bold">$14.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mb-6 space-y-2">
              <PricingFeature text="Customizable categories" included />
              <PricingFeature text="Manual transaction entry" included />
              <PricingFeature text="Bank account linking" included />
              <PricingFeature text="Automatic transaction imports" included />
              <PricingFeature text="AI transaction categorization" included />
            </ul>
            <Button
              className="w-full bg-primary text-gray-900 hover:bg-amber-600 border border-amber-600 mt-auto"
              onClick={() => handleUpgrade(PRICE_IDS.MONTHLY)}
            >
              Upgrade Now
            </Button>
          </Card>

          {/* Annual Plan */}
          <Card className="flex flex-col p-6 border-amber-600 border-2 bg-amber-50/30 shadow-lg relative">
            <div className="absolute -top-3 -right-3 bg-amber-500 text-gray-900 px-4 py-1 rounded-full font-bold text-sm">
              SAVE 33%
            </div>
            <div className="mb-4 text-center">
              <div className="mb-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">
                RECOMMENDED
              </div>
              <h3 className="text-2xl font-bold">Premium Annual</h3>
              <p className="text-muted-foreground">Best value</p>
            </div>
            <div className="mb-4 text-center">
              <span className="text-4xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
              <div className="text-sm text-muted-foreground mt-1">
                Billed annually ($119.88/year)
              </div>
            </div>
            <ul className="mb-6 space-y-2">
              <PricingFeature text="Customizable categories" included />
              <PricingFeature text="Manual transaction entry" included />
              <PricingFeature text="Bank account linking" included />
              <PricingFeature text="Automatic transaction imports" included />
              <PricingFeature text="AI transaction categorization" included />
            </ul>
            <Button
              className="w-full bg-primary text-gray-900 hover:bg-amber-600 border border-amber-600 mt-auto"
              onClick={() => handleUpgrade(PRICE_IDS.ANNUAL)}
            >
              Upgrade Now
            </Button>
          </Card>
        </div>

        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-amber-600 bg-white shadow-md px-6 py-4 max-w-xl w-full">
            <span className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-100 border border-amber-200">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4"
                />
              </svg>
            </span>
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-base">
                30-Day Money-Back Guarantee
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Not satisfied? Contact us at{' '}
                <span className="font-semibold text-amber-700">
                  support@fincapy.com
                </span>{' '}
                within 30 days for a full refund.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function PricingFeature({ text, included }) {
  return (
    <li className="flex items-center">
      <span
        className={`mr-2 text-lg ${included ? 'text-green-500' : 'text-muted-foreground'}`}
      >
        {included ? '✓' : '✕'}
      </span>
      <span className={included ? '' : 'text-muted-foreground'}>{text}</span>
    </li>
  );
}
