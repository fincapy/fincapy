'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InputTOTP } from '../input-totp';
import { verifyTOTP } from './serverActions';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const TOTPVerificationForm = () => {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const getTimeLeft = () => {
    if (typeof window !== 'undefined') {
      const timestamp = sessionStorage.getItem('emailPasswordCountdown');
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
  }, [router, timeLeft]);

  const handleOTPComplete = async (otp) => {
    setIsSubmitting(true);
    const result = await verifyTOTP(otp);
    if (!result) {
      setError('Invalid verification code. Please try again.');
    }
    setIsSubmitting(false);
  };

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    if (!backupCode.trim()) {
      setError('Please enter a backup code');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyTOTP(backupCode, true);
    if (!result) {
      setError('Invalid backup code. Please try again.');
    }
    setIsSubmitting(false);
  };

  if (!mounted)
    return (
      <Skeleton className="lg:w-[384px] md:w-[384px] sm:w-[384px] w-[96%] h-[160px] rounded-xl bg-card" />
    );

  return (
    <Card className="lg:w-[384px] md:w-[384px] sm:w-[384px] w-[96%] border">
      <CardContent className="pt-6 flex flex-col items-center justify-center gap-1">
        <div className="flex w-full flex-col items-center justify-center">
          {!useBackupCode ? (
            <>
              <InputTOTP
                onComplete={handleOTPComplete}
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex w-full flex-col items-center justify-center mt-2">
                {timeLeft > 0 && (
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(timeLeft / 60)}:
                      {(timeLeft % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-muted-foreground">remaining</span>
                  </div>
                )}
                <Button
                  variant="link"
                  className="text-xs text-muted-foreground hover:text-primary text-wrap -mt-1"
                  onClick={() => setUseBackupCode(true)}
                  type="button"
                >
                  Lost access to your authenticator app? Use a backup code
                </Button>
              </div>
            </>
          ) : (
            <form
              onSubmit={handleBackupCodeSubmit}
              className="w-full flex-col gap-4 items-center justify-center"
            >
              <Input
                placeholder="Enter backup code"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value)}
                className="mt-2"
                disabled={isSubmitting}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2"
              >
                Verify
              </Button>

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
                    setUseBackupCode(false);
                    setError('');
                  }}
                  type="button"
                >
                  Return to verification code
                </Button>
              </div>
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { TOTPVerificationForm };
