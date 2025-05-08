'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function UpgradeCompletePage({ paymentStatus }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (paymentStatus === 'paid') {
      if (countdown === 0) {
        router.push('/app');
        return;
      }
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, router, paymentStatus]);

  // Animation classes
  const cardAnimation =
    'animate-fade-in-up transition-all duration-500 ease-out';

  if (paymentStatus === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card
          className={`w-full max-w-md border-2 border-gray-300 shadow-2xl bg-white rounded-2xl flex flex-col items-center ${cardAnimation}`}
          style={{ boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.10)' }}
        >
          <CardHeader className="flex flex-col items-center justify-center gap-2">
            <Sparkles className="h-14 w-14 text-amber-500" />
            <CardTitle className="text-3xl font-extrabold mb-1 text-gray-900 text-center">
              Thank you for your purchase!
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground text-center">
              Your payment was successful.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center w-full pt-0">
            <div className="mt-6 text-base text-muted-foreground text-center">
              Redirecting to your dashboard in{' '}
              <span className="font-bold text-amber-700 text-lg">
                {countdown}
              </span>{' '}
              second{countdown !== 1 ? 's' : ''}...
              <br />
              <Link
                href="/app"
                className="mt-2 underline text-emerald-700 hover:text-emerald-900 font-semibold text-base focus:outline-none"
                aria-label="Go to dashboard now"
              >
                Go to dashboard now
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for any status other than 'paid'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-white py-12 px-4">
      <Card
        className={`w-full max-w-md border-2 border-rose-400 shadow-2xl bg-white rounded-2xl flex flex-col items-center ${cardAnimation}`}
        style={{ boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.10)' }}
      >
        <CardHeader className="flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center h-20 w-20 rounded-full bg-rose-100 border-4 border-rose-200 mb-2 animate-pop">
            <AlertCircle className="h-14 w-14 text-rose-600" />
          </div>
          <CardTitle className="text-3xl font-extrabold mb-1 text-rose-600 text-center">
            Payment Error
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground text-center">
            There was a problem processing your payment.
            <br />
            Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center w-full pt-0">
          <button
            onClick={() => router.push('/app/upgrade')}
            className="mt-6 px-8 py-3 rounded-full bg-rose-600 text-white font-bold shadow hover:bg-rose-700 transition-colors text-lg border border-rose-700"
          >
            Retry Payment
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

// Tailwind animation utilities (add to your global CSS if not present):
// .animate-fade-in-up { @apply opacity-0 translate-y-8; animation: fadeInUp 0.5s forwards; }
// .animate-pop { animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both; }
// @keyframes fadeInUp { to { opacity: 1; transform: none; } }
// @keyframes pop { 0% { transform: scale(0.7); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
