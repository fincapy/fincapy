'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputTOTP } from '../input-totp';
import { EyeIcon, EyeOffIcon, CopyIcon, CheckIcon } from 'lucide-react';
import { generateTOTPSecret, verifyAndSaveTOTP } from './serverActions';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { Skeleton } from '../ui/skeleton';

const TOTPRegistrationForm = () => {
  const [mounted, setMounted] = useState(false);
  const [secret, setSecret] = useState(null);
  const [otpauthUrl, setOtpauthUrl] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const getTimeLeft = () => {
    if (typeof window !== 'undefined') {
      const timestamp = sessionStorage.getItem('totpRegistrationTimestamp');
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
  const timerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (timeLeft > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              clearInterval(timerRef.current);
              sessionStorage.removeItem('totpRegistrationTimestamp');
              router.push('/signin');
            }
            return Math.max(0, newTime);
          });
        }, 1000);
        return () => clearInterval(timerRef.current);
      }
    }
  }, [timeLeft, router]);

  useEffect(() => {
    const initTOTP = async () => {
      const { otpauthUrl, secret } = await generateTOTPSecret();
      setSecret(secret);
      setOtpauthUrl(otpauthUrl);
      setMounted(true);
    };
    initTOTP();
  }, []);

  if (!mounted) {
    return <Skeleton className="w-[382.27px] h-[436px] rounded-xl bg-card" />;
  }

  const handleOTPComplete = async (otp) => {
    if (!secret) return;

    try {
      setError('');
      setIsSubmitting(true);
      const result = await verifyAndSaveTOTP(otp, secret);

      if (result) {
        sessionStorage.removeItem('totpRegistrationTimestamp');
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

  return (
    <Card className="bg-background w-[384px] shadow-lg">
      <CardContent className="pt-6">
        <div className="flex w-full flex-col items-center justify-center gap-1">
          {otpauthUrl && (
            <div className="mb-4">
              <QRCodeSVG value={otpauthUrl} size={200} />
            </div>
          )}
          <p className="text-sm text-center text-muted-foreground">
            Scan this QR code with your authenticator app or enter this code
            manually:
          </p>
          <div className="relative mb-6 w-[314.5px]">
            <div className="flex items-center gap-2 bg-muted rounded">
              <code className="flex-1 text-sm text-center break-all">
                {showSecret ? secret : '••••••••••••••••••••••••••••'}
              </code>
              <div className="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowSecret(!showSecret)}
                  type="button"
                >
                  {showSecret ? (
                    <EyeOffIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 -ml-[8px]"
                  onClick={async () => {
                    await navigator.clipboard.writeText(secret);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  type="button"
                >
                  {copied ? (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <CopyIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <InputTOTP onComplete={handleOTPComplete} disabled={isSubmitting} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex w-full flex-col items-center justify-center gap-1 mt-2">
            {timeLeft > 0 && (
              <div className="flex items-center space-x-1 text-xs">
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

export { TOTPRegistrationForm };
