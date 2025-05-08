'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WaitlistModal } from '@/components/waitlist-modal';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const ctaText = 'Join the waitlist';
  const [modalOpen, setModalOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);
  const logoRef = useRef(null);
  const ctaButtonRef = useRef(null);
  const MIXPANEL_TOKEN = '050c483ab6f1f8fd53a396d95f7b3c4c';

  const handleOpenModal = () => {
    setModalOpen(true);
    window.mixpanel.track('sign_up_button_clicked', {});
  };

  const toggleBilling = () => {
    setAnnualBilling(!annualBilling);
  };

  useEffect(() => {
    window.mixpanel.init(MIXPANEL_TOKEN || 'YOUR_TOKEN', {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: false,
      persistence: 'localStorage',
      ip: 0,
    });

    // Set or get a persistent anonymous ID
    let distinctId = localStorage.getItem('mp_anonymous_id');
    if (!distinctId) {
      distinctId = uuidv4();
      localStorage.setItem('mp_anonymous_id', distinctId);
    }

    // Identify the user with the anonymous ID
    window.mixpanel.identify(distinctId);
    if (!localStorage.getItem('mp_existing_user')) {
      window.mixpanel.track('home_page_viewed', {});
    }
  }, [MIXPANEL_TOKEN]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="flex h-[10vh] items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Image
                ref={logoRef}
                src="/icons/android-chrome-192x192.png"
                alt="Fincapy Logo"
                width={60}
                height={60}
                className={`h-[60px] w-[60px] sm:ml-[9px] ml-[1px]`}
                priority
              />
            </div>
          </Link>
          <div className="flex items-center gap-3 sm:px-7 px-3">
            <Link href="/signin">
              <Button
                variant="outline"
                className="border-secondary text-emerald-700 hover:border-amber-600 hover:text-amber-700"
              >
                Sign In
              </Button>
            </Link>
            <Button
              className="bg-primary text-gray-900 hover:bg-amber-600 border border-amber-600"
              onClick={handleOpenModal}
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full h-[90vh] flex-col items-center justify-center content-center -mt-20 mb-10 sm:mb-0">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center w-full">
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto flex flex-col items-center justify-center">
            <div className="max-w-xs sm:max-w-xl">
              <h1 className="sm:text-6xl text-5xl font-bold tracking-tighter text-center text-gray-900">
                Who Will <span className="text-secondary">Your Money</span> Make
                You?
              </h1>
            </div>
            <div className="max-w-[95vw]">
              <p className="text-muted-foreground md:text-xl text-lg text-center italic">
                Understand yourself and your finances. Instant insights, zero
                hassle, capybara approved.
              </p>
            </div>
            <Button
              ref={ctaButtonRef}
              size="lg"
              className="w-[200px] bg-amber-500 text-gray-900 hover:bg-amber-600 font-bold text-md relative border border-amber-600"
              onClick={handleOpenModal}
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className="py-12 md:py-24 lg:py-32 w-full">
        <div className="container px-4 mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              About Us
            </h2>
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-6 items-center">
            <div className="w-full md:w-1/2 space-y-4 order-2 md:order-none">
              <p className="text-muted-foreground">
                Hi! I&apos;m Ryan Wible, the founder of Fincapy, and these are
                some goats that I found. Over the past few years, I&apos;ve been
                on a journey to understand myself and my finances. I want to be
                an integrated person and part of that is what I do with my
                money.
              </p>
              <p className="text-muted-foreground">
                I created Fincapy to help me understand my spending in a simple
                and intuitive way. Do I spend a lot on groceries? Most
                certainly. Is it because I love to cook? Also yes. Does that
                make me a bad person? Absolutely not. With Fincapy, I can see
                where my money is going and make adjustments as needed.
              </p>
              <p className="text-muted-foreground">
                I want to empower you with the tools you need to understand
                yourself and your finances. I hope that Fincapy will be a part
                of your journey in financial wellness.
              </p>
            </div>
            <div className="w-full md:w-1/2 order-1 flex justify-center">
              <Image
                src="/goats.png"
                alt="Founder on a trail in Greece looking up at goats on a wall"
                width={500}
                height={500}
                className="h-auto w-full max-w-[400px] rounded-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 md:py-24 lg:py-32 bg-background">
        <div className="px-4 md:px-6">
          <div className="mb-8 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Features
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Customizable Categories"
              description="Create your own spending, income, and savings categories that match your unique lifestyle and financial goals."
              icon="📊"
            />
            <FeatureCard
              title="AI Transaction Sorting"
              description="Our AI automatically categorizes your transactions, saving you time and reducing manual work."
              icon="🤖"
            />
            <FeatureCard
              title="Full Control"
              description="Manage your finances your way with complete control over your budgeting approach."
              icon="🎛️"
            />
            <FeatureCard
              title="Bank Connection"
              description="Securely connect your bank accounts for automatic transaction importing."
              icon="🏦"
            />
            <FeatureCard
              title="Insights & Analytics"
              description="Get powerful insights into your spending habits."
              icon="📈"
            />
            <FeatureCard
              title="Mobile First"
              description="Access your budget anytime, anywhere with our responsive mobile design."
              icon="📱"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-12 md:py-24 lg:py-32">
        <div className="px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Choose the plan that works best for your financial journey.
            </p>
            <div className="flex flex-col items-center gap-4 mt-4">
              <span
                className={`inline-block rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 mb-2 ${
                  annualBilling ? 'opacity-100' : 'opacity-0'
                }`}
              >
                Save 33%
              </span>
              <div className="relative flex items-center justify-center w-full">
                <div className="relative flex h-9 w-64 rounded-full border border-amber-600 bg-background p-1">
                  <button
                    onClick={() => setAnnualBilling(true)}
                    className={`relative flex-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      annualBilling
                        ? 'bg-amber-500 text-gray-900'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Annual
                  </button>
                  <button
                    onClick={() => setAnnualBilling(false)}
                    className={`relative flex-1 rounded-full text-sm font-medium transition-all duration-200 ${
                      !annualBilling
                        ? 'bg-amber-500 text-gray-900'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            <Card className="flex flex-col border-amber-600 p-6 border">
              <div className="mb-4 text-center">
                <div className="mb-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-white">
                  RECOMMENDED
                </div>
                <h3 className="text-2xl font-bold">Premium</h3>
                <p className="text-muted-foreground">Automate everything</p>
              </div>
              <div className="mb-4 text-center">
                <span className="text-4xl font-bold">
                  ${annualBilling ? '9.99' : '14.99'}
                </span>
                <span className="text-muted-foreground">/month</span>
                {annualBilling && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Billed annually ($119.88/year)
                  </div>
                )}
              </div>
              <ul className="mb-6 space-y-2">
                <PricingFeature text="Everything in Free" included />
                <PricingFeature text="Bank account linking" included />
                <PricingFeature text="Automatic transaction imports" included />
                <PricingFeature text="AI transaction categorization" included />
              </ul>
              <Button
                className="w-full bg-primary text-gray-900 hover:bg-amber-600 border border-amber-600"
                onClick={handleOpenModal}
              >
                {ctaText}
              </Button>
            </Card>

            <Card className="flex flex-col p-6 border">
              <div className="mb-4 text-center">
                <h3 className="text-2xl font-bold">Free</h3>
                <p className="text-muted-foreground">Check it out</p>
              </div>
              <div className="mb-4 text-center">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-6 space-y-2">
                <PricingFeature text="Customizable categories" included />
                <PricingFeature text="Manual transaction entry" included />
                <PricingFeature text="Bank account linking" included={false} />
                <PricingFeature
                  text="AI transaction categorization"
                  included={false}
                />
              </ul>
              <Button
                className="w-full bg-card hover:bg-background mt-auto"
                variant="outline"
                onClick={handleOpenModal}
              >
                {ctaText}
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
      </section>

      {/* Testimonials Section */}
      {/* <section id="testimonials" className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              What Our Users Say
            </h2>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Don't just take our word for it. Here's what people are saying
              about Fincapy.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              quote="Fincapy changed how I think about budgeting. The customizable categories are perfect for my unique spending habits."
              author="Alex P."
              role="Software Developer"
            />
            <TestimonialCard
              quote="The AI categorization is surprisingly accurate! It saves me hours every month that I used to spend manually sorting transactions."
              author="Morgan T."
              role="Marketing Specialist"
            />
            <TestimonialCard
              quote="I've tried many budgeting apps, but Fincapy is the first one that actually fits my lifestyle. The capybara is cute too!"
              author="Jamie K."
              role="Freelance Designer"
            />
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="bg-emerald-700 py-12 md:py-24">
        <div className="px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
              Ready to Take Control of Your Finances?
            </h2>
            <Button
              size="lg"
              className="bg-primary border border-amber-200 hover:bg-amber-600 text-gray-900"
              onClick={handleOpenModal}
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-8 md:py-10">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center gap-6 max-w-xl mx-auto">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              <div>
                <Link
                  href="/blog"
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Blog
                </Link>
              </div>
              <div>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Privacy Policy
                </Link>
              </div>
              <div>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Terms of Service
                </Link>
              </div>
              <div>
                <Link
                  href="/trust"
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Why Trust Us
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-6">
            <p className="text-sm text-muted-foreground text-center">
              © {new Date().getFullYear()} Fincapy LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Waitlist Modal */}
      <WaitlistModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}

// Helper components
function FeatureCard({ title, description, icon }) {
  return (
    <Card className="flex flex-col items-center p-6 text-center border">
      <div className="mb-4 text-4xl">{icon}</div>
      <h3 className="mb-2 text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </Card>
  );
}

function TestimonialCard({ quote, author, role }) {
  return (
    <Card className="flex flex-col p-6">
      <div className="mb-4 text-4xl">&quot;</div>
      <p className="mb-4 flex-grow text-muted-foreground">{quote}</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-muted-foreground">{role}</p>
      </div>
    </Card>
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
