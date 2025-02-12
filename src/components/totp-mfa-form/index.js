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
    <div className="flex flex-col items-center justify-center -mt-4 gap-1">
      <div className="flex flex-col items-center gap-0 mb-2">
        <h2 className="text-2xl font-semibold tracking-tight">
          Enter your authenticator app code
        </h2>
      </div>
      <Card className="bg-background w-[384px] shadow-lg">
        <CardContent className="pt-6 flex flex-col items-center justify-center gap-1 h-32">
          {/* <span className="text-sm text-muted-foreground">Code:</span> */}
          <div className="flex w-full flex-col items-center justify-center gap-4">
            <InputTOTP onComplete={handleOTPComplete} />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { TOTPMFAForm };
