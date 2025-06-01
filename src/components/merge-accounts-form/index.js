'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  authenticateForMerge,
  verifyTOTPForMerge,
  confirmAccountMerge,
} from './serverActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { InputTOTP } from '@/components/input-totp';
import SubmitButton from '../SubmitButton';

export function MergeAccountsForm({ googleUserEmail, googleUserName }) {
  const [email, setEmail] = useState(googleUserEmail || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('authenticate'); // 'authenticate', 'totp', 'confirm'
  const [requiresTOTP, setRequiresTOTP] = useState(false);

  // Auto-populate email if provided
  useEffect(() => {
    if (googleUserEmail) {
      setEmail(googleUserEmail);
    }
  }, [googleUserEmail]);

  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    setLoading(true);
    const result = await authenticateForMerge({ email, password });
    setLoading(false);

    if (result.success) {
      if (result.requiresTOTP) {
        setRequiresTOTP(true);
        setStep('totp');
      } else {
        setStep('confirm');
      }
    } else {
      setError(result.error || 'Invalid email or password');
    }
  };

  const handleTOTPSubmit = async (totpCode) => {
    setError('');
    setLoading(true);

    const result = await verifyTOTPForMerge(totpCode);
    setLoading(false);

    if (result.success) {
      setStep('confirm');
    } else {
      setError(result.error || 'Invalid verification code');
    }
  };

  const handleConfirmMerge = async () => {
    setError('');
    setLoading(true);

    const result = await confirmAccountMerge();
    setLoading(false);

    if (!result.success) {
      setError(result.error || 'Failed to merge accounts');
    }
    // If successful, the server action will redirect
  };

  if (step === 'totp') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center -mt-4 gap-1 w-[100vw]'
        )}
      >
        <Card className="bg-card w-[95%] sm:w-96 flex flex-col items-center border">
          <CardContent className="pt-6 w-full">
            <div className="grid gap-4">
              <div className="flex flex-col items-center gap-0 mb-2">
                <h3 className="text-xl text-center font-semibold tracking-tight">
                  Enter Your Authenticator Code
                </h3>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Please enter the 6-digit code from your authenticator app
                </p>
              </div>
              <div className="flex justify-center -mt-1">
                <InputTOTP onComplete={handleTOTPSubmit} disabled={loading} />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center -mt-4 gap-1 w-[100vw]'
        )}
      >
        <Card className="bg-card w-[95%] sm:w-96 flex flex-col items-center border">
          <CardContent className="pt-6 w-full">
            <div className="grid gap-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Important:</strong> After merging, you will only be
                  able to sign in with Google. Your current password and
                  two-factor authentication will be removed permanently.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <SubmitButton
                  onClick={handleConfirmMerge}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Merging Accounts...
                    </>
                  ) : (
                    <>Confirm Merge</>
                  )}
                </SubmitButton>
                <Button
                  variant="outline"
                  onClick={() =>
                    setStep(requiresTOTP ? 'totp' : 'authenticate')
                  }
                  disabled={loading}
                >
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: email/password authentication step
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center -mt-4 gap-1 w-[100vw]'
      )}
    >
      <div className="flex flex-col gap-6 w-full items-center">
        <Card className="bg-card w-[95%] sm:w-96 flex flex-col items-center border">
          <CardContent className="pt-6 w-full">
            <form onSubmit={handleEmailPasswordSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!googleUserEmail} // Disable if pre-filled from Google
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Current Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your current password"
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <SubmitButton
                    type="submit"
                    className="w-full text-sm"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      'Continue'
                    )}
                  </SubmitButton>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
