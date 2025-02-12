'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InputTOTP } from '../input-totp';
import { verifyTOTP } from './serverActions';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '../ui/skeleton';

const TOTPMFAForm = () => {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const timerRef = useRef(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(timerRef.current);
            router.push('/signin');
          }
          return Math.max(0, newTime);
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [router, timeLeft]);

  const handleOTPComplete = async (otp) => {
    try {
      setError('');
      setIsSubmitting(true);
      const result = await verifyTOTP(otp);
      if (result) {
        router.push('/app');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('TOTP verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted)
    return <Skeleton className="w-[384px] h-[141.73px] rounded-xl bg-card" />;

  return (
    <div className="flex flex-col items-center justify-center -mt-4 gap-1">
      <div className="flex flex-col items-center gap-0 mb-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Enter your authenticator app code
        </h2>
      </div>
      <Card className="bg-background w-[384px] shadow-lg">
        <CardContent className="pt-6 flex flex-col items-center justify-center gap-1 h-32">
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <InputTOTP onComplete={handleOTPComplete} disabled={isSubmitting} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex w-full flex-col items-center justify-center gap-1">
              {timeLeft > 0 && (
                <div className="flex items-center space-x-1 text-xs -mb-4">
                  <span className="text-xs text-muted-foreground">
                    {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                  <span className="text-muted-foreground">remaining</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { TOTPMFAForm };
