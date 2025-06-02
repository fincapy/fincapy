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
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, LockKeyhole } from 'lucide-react';
import { EmailVerificationForm } from '../email-verification-form';
import { TOTPRegistrationForm } from '../totp-registration-form';
import { AccessCodeContext } from '../access-gate';
import { useContext } from 'react';
import Link from 'next/link';
import SubmitButton from '../SubmitButton';
import { GoogleSignInButton } from '../ui/google-signin-button';
import { Separator } from '../ui/separator';

const PasswordSignupForm = ({ nonce, progressionPoint }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const accessCode = useContext(AccessCodeContext);
  const searchParams = useSearchParams();

  // Handle OAuth errors from URL params
  useEffect(() => {
    const oauthError = searchParams.get('error');
    const customMessage = searchParams.get('message');

    if (oauthError) {
      switch (oauthError) {
        case 'oauth_error':
          setError('There was an error with Google sign-in. Please try again.');
          break;
        case 'access_denied':
          setError('Invalid access code.');
          break;
        case 'email_not_verified':
          setError(
            'Your Google account email is not verified. Please verify your email with Google first.'
          );
          break;
        case 'session_error':
          setError(
            'There was an error creating your session. Please try again.'
          );
          break;
        case 'account_exists':
          setError(
            customMessage ||
              'An account with this email already exists. Please sign in with your email and password instead.'
          );
          break;
        case 'oauth_signin_required':
          setError(
            'Unable to sign up with Google. If you have an existing account, please try signing in instead.'
          );
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  const validatePassword = (pass) => {
    // Minimum 8 characters with at least 3 of the 4 character types:
    // uppercase, lowercase, numbers, and special characters
    const minLength = pass.length >= 8;
    const hasUppercase = /[A-Z]/.test(pass);
    const hasLowercase = /[a-z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecials = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass);

    // Count how many character types are present
    const typeCount = [
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecials,
    ].filter(Boolean).length;

    return minLength && typeCount >= 3;
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
        'Password must be at least 8 characters and contain at least 3 of the 4 character types: uppercase, lowercase, number, and special character'
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
      sessionStorage.setItem('signupTimestamp', Date.now().toString());
      // createAccount already redirects to verify-email on success
    } else {
      setLoading(false);
      setError('An error occurred while creating your account');
    }
  };

  const isFormValid = name && email && password && confirmPassword;

  return (
    <div className="w-full space-y-6">
      <div className="space-y-6">
        {/* Google Sign-in Button */}
        <div className="w-full">
          <GoogleSignInButton className="w-full h-12 text-base font-medium">
            Continue with Google
          </GoogleSignInButton>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-sm uppercase">
            <span className="bg-background px-3 text-muted-foreground font-medium">
              Or
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <Input
              id="name"
              type="text"
              placeholder="First Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary placeholder:text-muted-foreground"
            />

            <Input
              id="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary placeholder:text-muted-foreground"
            />

            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 text-base bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary placeholder:text-muted-foreground"
            />

            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 text-base bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary placeholder:text-muted-foreground"
            />

            {error && (
              <Alert variant="destructive" className="border border-red-300">
                <AlertDescription className="text-base">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <SubmitButton
              type="submit"
              className={`w-full h-12 text-base font-semibold rounded-lg transition-colors ${
                !isFormValid
                  ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed hover:bg-gray-300'
                  : ''
              }`}
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Sign up'
              )}
            </SubmitButton>
          </div>

          <div className="text-center">
            <p className="text-base text-muted-foreground">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-amber-700 hover:text-amber-800 underline-offset-4 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="text-balance text-center text-xs text-muted-foreground">
            By clicking Sign up, you agree to our{' '}
            <Link
              href="/terms-of-service"
              className="text-amber-700 hover:text-amber-800 underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link
              href="/privacy-policy"
              className="text-amber-700 hover:text-amber-800 underline-offset-4 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </div>
        </form>
      </div>
    </div>
  );
};

export { PasswordSignupForm };
