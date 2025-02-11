'use client';
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputTOTP } from '../input-totp';
import { verifyEmail } from './serverActions';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const EmailMFAForm = ({ setEmailVerified }) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/signin');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, router]);

  const handleOTPComplete = async (otp) => {
    try {
      setError('');
      setIsSubmitting(true);
      
      const result = await verifyEmail(otp);
      
      if (result === 'cookie_invalid') {
        router.push('/signin');
        return;
      }
      
      if (result === true) {
        if (setEmailVerified) {
          setEmailVerified(true);
        }
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Email verification error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-background w-[384px] shadow-lg">
      <CardContent className="pt-6">
        <div className="flex w-full flex-col items-center justify-center gap-4">
          <InputTOTP 
            onComplete={async (otp) => await handleOTPComplete(otp)} 
            disabled={isSubmitting}
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
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
              onClick={() => {
                setTimeLeft(600);
                setError('');
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

export { EmailMFAForm };
