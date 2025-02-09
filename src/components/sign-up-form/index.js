'use client';
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { createAccount, verifyEmail } from './serverActions';
import { InputTOTP } from '../input-totp';
import { useRouter } from 'next/navigation';
import { GalleryVerticalEnd, Loader2, LockKeyhole } from 'lucide-react';

const PasswordSignupForm = ({ nonce }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [partiallyRegistered, setPartiallyRegistered] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const validatePassword = (pass) => {
    if (pass.length < 8) return false;
    if (!/[A-Z]/.test(pass)) return false;
    if (!/[a-z]/.test(pass)) return false;
    if (!/[0-9]/.test(pass)) return false;
    if (!/[!@#$%^&*]/.test(pass)) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      setError(
        'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await createAccount(name, email, password);
    if (result) {
      setLoading(false);
      setPartiallyRegistered(true);
    } else {
      setLoading(false);
      setError('An error occurred while creating your account');
    }
  };

  // const router = useRouter();

  const handleOTPComplete = async (otp) => {
    const result = await verifyEmail(otp);
    if (result) {
      router.push('/app');
    } else {
      console.log();
      setError('Invalid OTP');
    }
  };

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <a
            href="#"
            className="flex items-center gap-2 self-center font-medium"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <LockKeyhole className="size-4" />
            </div>
            Fincapy
          </a>
          {partiallyRegistered ? (
            <div className="flex flex-col items-center justify-center">
              <Card className="bg-background w-[384px] h-[192px] flex flex-col items-center justify-center">
                <CardHeader className="text-center">
                  <CardTitle className="text-md -mb-3">
                    Enter the one-time passcode sent to your email
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex w-full items-center justify-center">
                    <InputTOTP onComplete={(otp) => handleOTPComplete(otp)} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <Card className="bg-background">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Welcome!</CardTitle>
                  <CardDescription>
                    We&apos;re so excited you're here!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-6">
                      {/* <div className="flex flex-col gap-4">
                        <Button variant="outline" className="w-full">
                          Sign in with passkey
                        </Button>
                      </div>
                      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div> */}
                      <div className="grid gap-4">
                        <div className="grid gap-2 bg-background">
                          <Label htmlFor="name">First Name</Label>
                          <Input
                            id="name"
                            type="text"
                            placeholder="John"
                            required
                            className="bg-background"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2 bg-background">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            required
                            className="bg-background"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="confirmPassword">
                            Confirm Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                          />
                        </div>
                        {error && (
                          <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            </>
                          ) : (
                            'Sign up'
                          )}
                        </Button>
                      </div>
                      <div className="text-center text-sm">
                        Already have an account?{' '}
                        <a href="#" className="underline underline-offset-4">
                          Sign in
                        </a>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
              <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                By clicking Sign up, you agree to our{' '}
                <a href="#">Terms of Service</a> and{' '}
                <a href="#">Privacy Policy</a>.
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
};

export { PasswordSignupForm };
