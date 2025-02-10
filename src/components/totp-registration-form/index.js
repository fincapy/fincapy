'use client';
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InputTOTP } from '../input-totp';
import { generateTOTPSecret, verifyAndSaveTOTP } from './serverActions';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';

const TOTPRegistrationForm = () => {
  const [secret, setSecret] = useState(null);
  const [otpauthUrl, setOtpauthUrl] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const initTOTP = async () => {
      const { otpauthUrl, secret } = await generateTOTPSecret();
      setSecret(secret);
      setOtpauthUrl(otpauthUrl);
    };
    initTOTP();
  }, []);

  const handleOTPComplete = async (otp) => {
    if (!secret) return;

    const result = await verifyAndSaveTOTP(otp, secret);
    if (result) {
      router.push('/app');
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  return (
    <Card className="bg-background w-[384px] shadow-lg">
      <CardContent className="pt-6">
        <div className="flex w-full flex-col items-center justify-center gap-4">
          {otpauthUrl && (
            <div className="mb-4">
              <QRCodeSVG value={otpauthUrl} size={200} />
            </div>
          )}
          <p className="text-sm text-center text-muted-foreground mb-4">
            Scan this QR code with your authenticator app and enter the code
            below to verify
          </p>
          <InputTOTP onComplete={handleOTPComplete} />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export { TOTPRegistrationForm };
