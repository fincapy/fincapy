'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputTOTP } from '../input-totp';
import { verifyEmail, resendEmailVerificationCode } from './serverActions';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';

const EmailVerificationForm = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const getTimeLeft = () => {
    if (typeof window !== 'undefined') {
      const timestamp = sessionStorage.getItem('emailPasswordCountdown');

      if (timestamp) {
        const elapsed = Math.floor(
          (Date.now() - parseInt(timestamp, 10)) / 1000
        );
        const remaining = Math.max(0, 600 - elapsed);
        console.log(remaining);
        return remaining;
      }
    }
    return 600;
  };
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const timerRef = useRef(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (timeLeft > 0) {
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
    }
  }, []);

  const handleOTPComplete = async (otp) => {
    try {
      setIsSubmitting(true);

      const result = await verifyEmail(otp);
      if (!result) setError('Invalid verification code. Please try again.');
    } catch (err) {
      console.log('Email verification error:', err);
      setError('An error occurred. Please try again.');
      console.error('Email verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mounted)
    return <Skeleton className="w-[384px] h-[141.73px] rounded-xl bg-card" />;

  return (
    <Card className="bg-background w-[384px] shadow-lg">
      <CardContent className="pt-6">
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <InputTOTP
            onComplete={async (otp) => await handleOTPComplete(otp)}
            disabled={isSubmitting}
          />
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
            <Button
              variant="link"
              className="text-xs text-muted-foreground hover:text-primary"
              onClick={async () => {
                try {
                  setIsSubmitting(true);
                  setError('');
                  const result = await resendEmailVerificationCode();
                  if (result) {
                    sessionStorage.setItem(
                      'emailPasswordCountdown',
                      Date.now().toString()
                    );
                    setTimeLeft(600);
                  } else {
                    setError('Failed to resend verification code. Please try again later.');
                  }
                } catch (err) {
                  console.error('Error resending code:', err);
                  setError('An error occurred. Please try again.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              Didn&apos;t receive the code? Resend
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { EmailVerificationForm };
