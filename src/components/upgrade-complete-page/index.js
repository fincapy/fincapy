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
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function UpgradeCompletePage({ paymentStatus }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

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

  if (paymentStatus === 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Card className="w-full max-w-md border border-border shadow-lg bg-card rounded-xl flex flex-col items-center">
          <CardHeader className="flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-2" />
            <CardTitle className="text-2xl font-bold mb-1">
              Thank you for your purchase!
            </CardTitle>
            <CardDescription className="text-md text-muted-foreground">
              Your payment was successful. Your account will be upgraded soon.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center w-full pt-0">
            <div className="mt-6 text-sm text-muted-foreground text-center">
              Redirecting to your dashboard in{' '}
              <span className="font-semibold text-primary">{countdown}</span>{' '}
              second{countdown !== 1 ? 's' : ''}...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for any status other than 'paid'
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md border border-border shadow-lg bg-card rounded-xl flex flex-col items-center">
        <CardHeader className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="h-16 w-16 text-destructive mb-2" />
          <CardTitle className="text-2xl font-bold mb-1 text-destructive">
            Payment Error
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            There was a problem processing your payment. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center w-full pt-0">
          <button
            onClick={() => router.push('/app/upgrade')}
            className="mt-6 px-6 py-2 rounded-lg bg-destructive text-white font-semibold shadow hover:bg-destructive/90 transition-colors"
          >
            Retry Payment
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
