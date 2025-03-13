'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { WaitlistModal } from '@/components/waitlist-modal';
import Head from 'next/head';

export default function Home() {
  const ctaText = 'Join the waitlist';
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Head>
        <title>Who will your money make you?</title>
        <meta
          name="description"
          content="Understand yourself and your finances with Fincapy.Instant insights, zero hassle, capybara approved. A customizable and automated budgeting solution that just works."
          key="desc"
        />
        <meta property="og:title" content="Who will your money make you?" />
        <meta
          property="og:description"
          content="Understand yourself and your finances with Fincapy. Instant insights, zero hassle, capybara approved. A customizable and automated budgeting solution that just works."
        />
        <meta property="og:image" content="https://fincapy.com/capybara.png" />

        {/* JSON-LD structured data for SEO */}
        <script
          type="application/ld+json"
          key="landing-jsonld"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://fincapy.com/#organization',
                  name: 'Fincapy LLC',
                  url: 'https://fincapy.com',
                  logo: {
                    '@type': 'ImageObject',
                    url: 'https://fincapy.com/icons/android-chrome-192x192.png',
                  },
                  description:
                    'Understand yourself and your finances with Fincapy. Instant insights, zero hassle, capybara approved. A customizable and automated budgeting solution that just works.',
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://fincapy.com/#website',
                  url: 'https://fincapy.com',
                  name: 'Fincapy',
                  description:
                    'Understand yourself and your finances with Fincapy. Instant insights, zero hassle, capybara approved.',
                  publisher: {
                    '@id': 'https://fincapy.com/#organization',
                  },
                },
                {
                  '@type': 'WebPage',
                  '@id': 'https://fincapy.com/#webpage',
                  url: 'https://fincapy.com',
                  name: 'Who will your money make you? | Fincapy',
                  description:
                    'Understand yourself and your finances with Fincapy. Instant insights, zero hassle, capybara approved. A customizable and automated budgeting solution that just works.',
                  isPartOf: {
                    '@id': 'https://fincapy.com/#website',
                  },
                  about: {
                    '@id': 'https://fincapy.com/#organization',
                  },
                },
                {
                  '@type': 'SoftwareApplication',
                  name: 'Fincapy',
                  operatingSystem: 'Web',
                  applicationCategory: 'FinanceApplication',
                  offers: [
                    {
                      '@type': 'Offer',
                      name: 'Free Plan',
                      price: '0',
                      priceCurrency: 'USD',
                      description:
                        'Customizable categories and manual transaction entry',
                      availability: 'https://schema.org/InStock',
                    },
                    {
                      '@type': 'Offer',
                      name: 'Premium Plan',
                      price: '9.99',
                      priceCurrency: 'USD',
                      description:
                        'Bank account linking, automatic transaction imports, and AI transaction categorization',
                      availability: 'https://schema.org/InStock',
                      priceValidUntil: new Date(
                        new Date().setFullYear(new Date().getFullYear() + 1)
                      )
                        .toISOString()
                        .split('T')[0],
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </Head>
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="flex h-[10vh] items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/icons/android-chrome-192x192.png"
              alt="Fincapy Logo"
              width={60}
              height={60}
              className="h-[60px] w-[60px] sm:ml-[9px] ml-[1px]"
              priority
            />
          </Link>
          <div className="flex items-center gap-3 sm:px-7 px-3">
            <Link href="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => setModalOpen(true)}
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="w-full h-[90vh] flex-col items-center justify-center content-center -mt-20">
        <div className="flex flex-col items-center gap-4 sm:gap-6 text-center w-full">
          <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto flex flex-col items-center justify-center">
            <h1 className="text-6xl font-bold tracking-tighter text-center">
              Who Will <span className="text-amber-600">Your Money</span> Make
              You?
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground md:text-xl text-center w-full">
              Understand yourself and your finances. Instant insights, zero
              hassle, capybara approved. A customizable and automated budgeting
              solution that just works.
            </p>
            <Button
              size="lg"
              className="w-[200px] bg-amber-600 text-white hover:bg-amber-700 font-bold text-md"
              onClick={() => setModalOpen(true)}
            >
              {ctaText}
            </Button>
          </div>
        </div>
      </section>

      <section id="about" className="py-12 md:py-24 lg:py-32 w-full">
        <div className="container px-4 mx-auto max-w-5xl">
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
                a truly integrated person and part of that is putting my money
                where my mouth is, literally.
              </p>
              <p className="text-muted-foreground">
                I created Fincapy to help me understand my spending in a simple
                and intuitive way. Do I spend too much on groceries? Most
                certainly. Is it because I love to cook? Also yes. Does that
                make me a bad person? Absolutely not. But maybe I don&apos;t
                care as much about travel (not true, but just go with it). With
                Fincapy, I can see where my money is going, what I need to
                budget for, and make adjustments.
              </p>
              <p className="text-muted-foreground">
                I want to empower you with the tools you need to understand
                yourself and your finances. I hope that Fincapy can be a part of
                your journey in financial wellness.
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
      <section id="features" className="bg-muted/50 py-12 md:py-24 lg:py-32">
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
      <section id="pricing" className="bg-muted/50 py-12 md:py-24 lg:py-32">
        <div className="px-4 md:px-6">
          <div className="mb-12 flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Simple, Transparent Pricing
            </h2>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Choose the plan that works best for your financial journey.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            <Card className="flex flex-col p-6">
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
                onClick={() => setModalOpen(true)}
              >
                {ctaText}
              </Button>
            </Card>

            <Card className="flex flex-col border-amber-600 p-6">
              <div className="mb-4 text-center">
                <div className="mb-2 inline-block rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
                  RECOMMENDED
                </div>
                <h3 className="text-2xl font-bold">Premium</h3>
                <p className="text-muted-foreground">Automate everything</p>
              </div>
              <div className="mb-4 text-center">
                <span className="text-4xl font-bold">$9.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="mb-6 space-y-2">
                <PricingFeature text="Everything in Free" included />
                <PricingFeature text="Bank account linking" included />
                <PricingFeature text="Automatic transaction imports" included />
                <PricingFeature text="AI transaction categorization" included />
              </ul>
              <Button
                className="w-full bg-amber-600 text-white hover:bg-amber-700"
                onClick={() => setModalOpen(true)}
              >
                {ctaText}
              </Button>
            </Card>
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
      <section className="bg-amber-600 py-12 md:py-24">
        <div className="px-4 md:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl">
              Ready to Take Control of Your Finances?
            </h2>
            <Button
              size="lg"
              className="mt-4 bg-white text-amber-600 hover:bg-background font-bold text-md"
              onClick={() => setModalOpen(true)}
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
    <Card className="flex flex-col items-center p-6 text-center">
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
