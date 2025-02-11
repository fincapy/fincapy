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
import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { createAccount, verifyEmail } from './serverActions';
import { InputTOTP } from '../input-totp';
import { useRouter } from 'next/navigation';
import { Loader2, LockKeyhole } from 'lucide-react';
import { EmailMFAForm } from '../email-mfa-form';
import { TOTPRegistrationForm } from '../totp-registration-form';
import { AccessCodeContext } from '../access-gate';
import { useContext } from 'react';

const PasswordSignupForm = ({ nonce, progressionPoint }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [partiallyRegistered, setPartiallyRegistered] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('signupTimeLeft');
      const storedTime = stored ? parseInt(stored, 10) : 600;
      const timestamp = localStorage.getItem('signupTimestamp');
      if (timestamp) {
        const elapsed = Math.floor((Date.now() - parseInt(timestamp, 10)) / 1000);
        return Math.max(0, storedTime - elapsed);
      }
      return storedTime;
    }
    return 600;
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [totpVerified, setTOTPVerified] = useState(false);
  const accessCode = useContext(AccessCodeContext);

  const progression = () => {
    if (
      (partiallyRegistered && emailVerified) ||
      progressionPoint === 'mfaRegistration'
    ) {
      return (
        <div className="flex flex-col items-center justify-center -mt-4 gap-1">
          <div className="flex flex-col items-center gap-0 mb-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Register your authenticator app
            </h2>
          </div>
          <TOTPRegistrationForm setTOTPVerified={setTOTPVerified} />
        </div>
      );
    }

    if (
      (partiallyRegistered && !emailVerified) ||
      progressionPoint === 'emailVerification'
    ) {
      return (
        <div className="flex flex-col items-center justify-center -mt-4 gap-1">
          <div className="flex flex-col items-center gap-0 mb-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Verify your email
            </h2>
          </div>
          <EmailMFAForm setEmailVerified={setEmailVerified} />
        </div>
      );
    }

    if (!emailVerified && !partiallyRegistered) {
      return (
        <div className="flex flex-col gap-6">
          <Card className="bg-background">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Welcome!</CardTitle>
              <CardDescription>
                We&apos;re so excited you&apos;re here!
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
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
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
                    <Button type="submit" className="w-full" disabled={loading}>
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
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </div>
        </div>
      );
    }
  };

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
    const result = await createAccount(name, email, password, accessCode);
    if (result) {
      setLoading(false);
      setPartiallyRegistered(true);
      localStorage.setItem('signupTimeLeft', '600');
      localStorage.setItem('signupTimestamp', Date.now().toString());
    } else {
      setLoading(false);
      setError('An error occurred while creating your account');
    }
  };

  // const router = useRouter();

  useEffect(() => {
    if (partiallyRegistered && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev <= 1 ? 0 : prev - 1;
          localStorage.setItem('signupTimeLeft', newTime.toString());
          if (newTime <= 0) {
            clearInterval(timer);
            localStorage.removeItem('signupTimeLeft');
            localStorage.removeItem('signupTimestamp');
            router.push('/signin');
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [partiallyRegistered, timeLeft, router]);

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
          {progression()}
        </div>
      </div>
    </ThemeProvider>
  );
};

export { PasswordSignupForm };
