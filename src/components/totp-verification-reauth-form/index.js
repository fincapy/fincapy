'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { InputTOTP } from '../input-totp';
import { verifyTOTPForHighRiskAction } from './serverActions';
import { Skeleton } from '../ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const TOTPVerificationReauthForm = ({ onSuccess, onCancel, className }) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');

  const handleOTPComplete = async (otp) => {
    setIsSubmitting(true);
    setError('');
    const result = await verifyTOTPForHighRiskAction(otp);
    setIsSubmitting(false);

    if (result) {
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } else {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!backupCode.trim()) {
      setError('Please enter a backup code');
      return;
    }

    setIsSubmitting(true);
    const result = await verifyTOTPForHighRiskAction(backupCode, true);
    setIsSubmitting(false);

    if (result) {
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } else {
      setError('Invalid backup code. Please try again.');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center -mt-4 gap-1 w-full',
        className
      )}
    >
      <div className="flex flex-col gap-6 w-full items-center mt-6">
        <Card className="bg-card w-full flex flex-col items-center border">
          <CardContent className="pt-6 flex flex-col items-center justify-center gap-1 w-full">
            <div className="flex w-full flex-col items-center justify-center">
              {!useBackupCode ? (
                <>
                  <InputTOTP
                    onComplete={handleOTPComplete}
                    disabled={isSubmitting}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex w-full flex-col items-center justify-center mt-2">
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
                    autoFocus
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex gap-2 w-full mt-2">
                    {onCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={onCancel}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      Verify
                    </Button>
                  </div>

                  <div className="flex w-full flex-col items-center justify-center gap-1">
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

              {!useBackupCode && (
                <div className="flex gap-2 w-full mt-4">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={onCancel}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { TOTPVerificationReauthForm };
