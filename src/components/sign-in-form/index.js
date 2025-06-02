'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  authenticateEmailPassword,
  sendPasswordResetEmail,
} from './serverActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import Link from 'next/link';
import SubmitButton from '../SubmitButton';
import { GoogleSignInButton } from '../ui/google-signin-button';
import { Separator } from '../ui/separator';
import { useSearchParams } from 'next/navigation';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
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
        case 'account_not_found':
          setError(
            'No account found with this Google email. Please sign up first or sign in with your email and password.'
          );
          break;
        default:
          setError('An unexpected error occurred. Please try again.');
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('All fields are required');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    sessionStorage.setItem('emailPasswordCountdown', Date.now().toString());
    const result = await authenticateEmailPassword({ email, password });
    if (!result) {
      setError('Invalid email or password');
    }
    setLoading(false);
  };

  return (
    <div className="w-full space-y-6">
      <div className="space-y-6">
        {/* Google Sign-in Button */}
        <div className="w-full">
          <GoogleSignInButton
            source="signin"
            className="w-full h-12 text-base font-medium"
          >
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
              id="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary placeholder:text-muted-foreground"
            />

            <div className="space-y-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 text-base bg-white border border-gray-300 rounded-lg px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary placeholder:text-muted-foreground"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setResetDialogOpen(true);
                    setResetEmailSent(false);
                  }}
                  className="text-sm text-amber-700 hover:text-amber-800 underline-offset-4 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            </div>

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
                !email || !password
                  ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed hover:bg-gray-300'
                  : ''
              }`}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </SubmitButton>
          </div>

          <div className="text-center">
            <p className="text-base text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="text-amber-700 hover:text-amber-800 underline-offset-4 hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent
          className="sm:max-w-md w-[95%] mx-auto rounded-lg bg-white shadow-lg border-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold">
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {!resetEmailSent
                ? "Enter your email address and we'll send you a link to reset your password if you have an account."
                : 'Check your email for a password reset link. The link will expire in 1 hour.'}
            </DialogDescription>
          </DialogHeader>

          {!resetEmailSent ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setResetLoading(true);
                try {
                  await sendPasswordResetEmail({ email: resetEmail });
                  setResetEmailSent(true);
                } catch (error) {
                  console.error('Failed to send reset email:', error);
                } finally {
                  setResetLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-base font-medium">
                  Email
                </Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="h-12 text-base bg-white border shadow-sm rounded-lg px-4 focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  required
                />
              </div>

              <DialogFooter>
                <SubmitButton
                  type="submit"
                  className="w-full h-12 text-base font-semibold rounded-lg"
                  disabled={resetLoading || !resetEmail}
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </SubmitButton>
              </DialogFooter>
            </form>
          ) : (
            <DialogFooter>
              <Button
                onClick={() => setResetDialogOpen(false)}
                className="w-full h-12 text-base font-semibold rounded-lg"
              >
                Close
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
