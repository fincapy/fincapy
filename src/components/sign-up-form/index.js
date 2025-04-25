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
import { useState, useEffect, useRef } from 'react';
import { createAccount, verifyEmail } from './serverActions';
import { InputTOTP } from '../input-totp';
import { useRouter } from 'next/navigation';
import { Loader2, LockKeyhole } from 'lucide-react';
import { EmailVerificationForm } from '../email-verification-form';
import { TOTPRegistrationForm } from '../totp-registration-form';
import { AccessCodeContext } from '../access-gate';
import { useContext } from 'react';
import Link from 'next/link';
import SubmitButton from '../SubmitButton';

const PasswordSignupForm = ({ nonce, progressionPoint }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const accessCode = useContext(AccessCodeContext);

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
    sessionStorage.setItem('emailPasswordCountdown', Date.now().toString());
    const result = await createAccount(name, email, password, accessCode);
    if (result) {
      setLoading(false);
      setPartiallyRegistered(true);
      sessionStorage.setItem('signupTimestamp', Date.now().toString());
    } else {
      setLoading(false);
      setError('An error occurred while creating your account');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="border">
        <CardContent className="mt-8">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    required
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
                    'Sign up'
                  )}
                </SubmitButton>
              </div>
              <div className="text-center text-sm">
                Already have an account?{' '}
                <Link href="/signin" className="underline underline-offset-4">
                  Sign in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
        By clicking Sign up, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
};

export { PasswordSignupForm };
