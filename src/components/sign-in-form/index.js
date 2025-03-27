'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
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

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
    <div
      className={cn(
        'flex flex-col items-center justify-center -mt-4 gap-1 w-[100vw]'
      )}
    >
      <div className="flex flex-col items-center gap-0 mb-2">
        <h2 className="text-2xl text-center font-semibold tracking-tight">
          Welcome back!
        </h2>
      </div>
      <div className="flex flex-col gap-6 w-full items-center">
        <Card className="bg-card w-11/12 sm:w-96 flex flex-col items-center">
          <CardContent className="pt-6 w-full">
            <form onSubmit={handleSubmit}>
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
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                      <button
                        type="button"
                        onClick={() => {
                          setResetEmail(email);
                          setResetDialogOpen(true);
                          setResetEmailSent(false);
                        }}
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    className="w-full text-white hover:bg-primary-dark"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      </>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </div>
                <div className="text-center text-sm">
                  Don&apos;t have an account?{' '}
                  <Link href="/signup" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent
          className="sm:max-w-md sm:w-md w-11/12 rounded-lg bg-card"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
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
              className="flex flex-col gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="m@example.com"
                  className="bg-background"
                  required
                />
              </div>

              <DialogFooter className="sm:justify-between">
                <Button
                  type="submit"
                  className="text-white hover:bg-primary-dark w-full"
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
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <DialogFooter>
              <Button
                onClick={() => setResetDialogOpen(false)}
                className="w-full"
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
