'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WaitlistModal } from '@/components/waitlist-modal';
import { v4 as uuidv4 } from 'uuid';

export default function WhyTrustUsContent() {
  const ctaText = 'Join the waitlist';
  const [modalOpen, setModalOpen] = useState(false);
  const MIXPANEL_TOKEN = '050c483ab6f1f8fd53a396d95f7b3c4c';

  const handleOpenModal = () => {
    setModalOpen(true);
    window.mixpanel?.track('sign_up_button_clicked', {});
  };

  useEffect(() => {
    window.mixpanel?.init(MIXPANEL_TOKEN || 'YOUR_TOKEN', {
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
    window.mixpanel?.identify(distinctId);
    if (!localStorage.getItem('mp_existing_user')) {
      window.mixpanel?.track('why_trust_us_page_viewed', {});
    }
  }, [MIXPANEL_TOKEN]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm">
        <div className="flex h-[10vh] items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Image
                src="/icons/android-chrome-192x192.png"
                alt="Fincapy Logo"
                width={60}
                height={60}
                className="h-[60px] w-[60px] sm:ml-[9px] ml-[1px]"
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
      <section className="w-full flex flex-col items-center justify-center text-center py-8 px-4">
        <h1 className="sm:text-6xl text-5xl font-bold tracking-tighter text-gray-900 mb-4">
          Why Trust <span className="text-secondary">Fincapy</span>?
        </h1>
        <p className="text-muted-foreground md:text-xl text-lg max-w-2xl mx-auto italic">
          Your privacy and security are our top priorities. Here&apos;s how we
          keep your data safe and your trust at the center of everything we do.
        </p>
      </section>

      {/* Security Section */}
      <section className=" md:py-20 bg-background">
        <div className="container px-4 mx-auto max-w-4xl">
          <Card className="p-8 mb-8 border border-gray-300">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="shield">
                🛡️
              </span>{' '}
              Security First
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-lg">
              <li>
                All data is encrypted in transit (TLS) and at rest (AES-256).
              </li>
              <li>
                Two-Factor Authentication (2FA) is mandatory for all users via
                authenticator apps (the most secure way to perform 2FA).
              </li>
              <li>
                Financial institution connections are handled securely via
                trusted third parties (Plaid). We never store your bank
                credentials.
              </li>
              <li>
                Billing is handled securely via Stripe. We never store your card
                details.
              </li>
              <li>Regular security audits and automated testing</li>
            </ul>
          </Card>

          {/* Privacy Section */}
          <Card className="p-8 mb-8 border border-gray-300">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="lock">
                🔒
              </span>{' '}
              Privacy by Design
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-lg">
              <li>
                Your data is yours. We never sell your information to third
                parties.
              </li>
              <li>
                Minimal data collection: only what&apos;s needed to provide our
                service.
              </li>
              <li>
                Only you can see your financial data. Here&apos;s what we can
                see:
                <ul className="list-disc pl-6">
                  <li>Your name and email address</li>
                  <li>
                    The number of financial institutions you have connected
                  </li>
                  <li>The billing status of your account</li>
                  <li>The number of users on your account</li>
                  <li>
                    That&apos;s it. We don&apos;t see your financial data.
                  </li>
                </ul>
              </li>
              <li>
                Delete your account/data at any time. Just shoot us an email at{' '}
                <span className="font-semibold text-amber-700">
                  support@fincapy.com
                </span>
              </li>
            </ul>
          </Card>

          {/* Infrastructure Section */}
          <Card className="p-8 mb-8 border border-gray-300">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="cloud">
                ☁️
              </span>{' '}
              Trusted Infrastructure
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-lg">
              <li>
                We use the most secure, privacy-first, and reliable
                infrastructure available.
              </li>
              <li>
                <span className="font-semibold">Amazon Bedrock</span> powers our
                AI transaction categorization—your data is processed securely
                using industry-leading cloud AI.
              </li>
              <li>
                <span className="font-semibold">AWS SES</span> is used for all
                transactional and notification emails, ensuring reliable and
                secure delivery.
              </li>
              <li>
                <span className="font-semibold">Fly.io</span> hosts our
                application services and databases, providing global, secure,
                and scalable infrastructure.
              </li>
            </ul>
          </Card>

          {/* Transparency Section */}
          <Card className="p-8 mb-8 border border-gray-300">
            <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
              <span role="img" aria-label="megaphone">
                📢
              </span>{' '}
              Radical Transparency
            </h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2 text-lg">
              <li>Clear, simple pricing—no hidden fees or surprise charges.</li>
              <li>30-day money-back guarantee if you&apos;re not satisfied.</li>
              <li>
                Open communication: reach us anytime at{' '}
                <span className="font-semibold text-amber-700">
                  support@fincapy.com
                </span>
                .
              </li>
              <li>
                We publish regular updates on security and privacy improvements.
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-700 py-12 md:py-20 mt-auto">
        <div className="px-4 md:px-6 flex flex-col items-center text-center">
          <h2 className="text-3xl font-bold tracking-tighter text-white sm:text-4xl md:text-5xl mb-4">
            Ready to experience secure, private budgeting?
          </h2>
          <Button
            size="lg"
            className="bg-primary border border-amber-200 hover:bg-amber-600 text-gray-900 font-bold"
            onClick={handleOpenModal}
          >
            {ctaText}
          </Button>
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
                  href="/privacy-policy"
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Privacy Policy
                </Link>
              </div>
              <div>
                <Link
                  href="/terms-of-service"
                  className="text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Terms of Service
                </Link>
              </div>
              <div>
                <Link
                  href="/why-trust-us"
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
