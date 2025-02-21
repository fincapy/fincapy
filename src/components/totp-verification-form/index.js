'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InputTOTP } from '../input-totp';
import { verifyTOTP } from './serverActions';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

const TOTPVerificationForm = () => {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getTimeLeft = () => {
    if (typeof window !== 'undefined') {
      const timestamp = sessionStorage.getItem('totpMfaTimestamp');
      if (timestamp) {
        const elapsed = Math.floor(
          (Date.now() - parseInt(timestamp, 10)) / 1000
        );
        const remaining = Math.max(0, 600 - elapsed);
        return remaining;
      }
    }
    return 600;
  };

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const timerRef = useRef(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!sessionStorage.getItem('totpMfaTimestamp')) {
        sessionStorage.setItem('totpMfaTimestamp', Date.now().toString());
      }
      if (timeLeft > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              clearInterval(timerRef.current);
              sessionStorage.removeItem('totpMfaTimestamp');
              router.push('/signin');
            }
            return Math.max(0, newTime);
          });
        }, 1000);
        return () => clearInterval(timerRef.current);
      }
    }
  }, [router, timeLeft]);

  const handleOTPComplete = async (otp) => {
    try {
      setIsSubmitting(true);
      const result = await verifyTOTP(otp);
      if (!result) {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted)
    return <Skeleton className="w-[384px] h-[129.73px] rounded-xl bg-card" />;

  return (
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
  );
};

export { TOTPVerificationForm };
