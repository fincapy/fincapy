'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InputTOTP } from '../input-totp';
import { verifyTOTP } from './serverActions';
import { useRouter } from 'next/navigation';

const TOTPMFAForm = () => {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleOTPComplete = async (otp) => {
    const result = await verifyTOTP(otp);
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
          <p className="text-sm text-center text-muted-foreground mb-4">
            Enter the code from your authenticator app to continue
          </p>
          <InputTOTP onComplete={handleOTPComplete} />
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export { TOTPMFAForm };
