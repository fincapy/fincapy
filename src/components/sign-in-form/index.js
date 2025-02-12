'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authenticateEmailPassword } from './serverActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThemeProvider } from '@/components/theme-provider';
import { GalleryVerticalEnd, Loader2 } from 'lucide-react';
import { TOTPMFAForm } from '../totp-mfa-form';

export function SignInForm({ nonce, mfaToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [partiallyAuthenticated, setPartiallyAuthenticated] = useState(false);
  const router = useRouter();

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

    try {
      setLoading(true);
      const result = await authenticateEmailPassword({ email, password });
      if (result) {
        setPartiallyAuthenticated(true);
      } else {
        throw new Error();
      }
    } catch (err) {
      setError('Invalid email or password');
      setLoading(false);
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
              <GalleryVerticalEnd className="size-4" />
            </div>
            Fincapy
          </a>
          {partiallyAuthenticated || mfaToken ? (
            <div className="flex flex-col items-center justify-center -mt-4 gap-1">
              <div className="flex flex-col items-center gap-0 mb-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Enter your authenticator app code
                </h2>
              </div>
              <TOTPMFAForm />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center -mt-4 gap-1">
              <div className="flex flex-col items-center gap-0 mb-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Welcome back!
                </h2>
              </div>
              <div className="flex flex-col gap-6">
                <Card className="bg-background">
                  <CardContent className="pt-6">
                    <form onSubmit={handleSubmit}>
                      <div className="grid gap-6">
                        <div className="grid gap-4">
                          <div className="grid gap-2 bg-background">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              placeholder="m@example.com"
                              required
                              className="bg-background"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <div className="flex items-center">
                              <Label htmlFor="password">Password</Label>
                              <a
                                href="#"
                                className="ml-auto text-sm underline-offset-4 hover:underline"
                              >
                                Forgot your password?
                              </a>
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
                            className="w-full"
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
                          <a href="#" className="underline underline-offset-4">
                            Sign up
                          </a>
                        </div>
                      </div>
                    </form>
                  </CardContent>
                </Card>
                <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary  ">
                  By clicking continue, you agree to our{' '}
                  <a href="#">Terms of Service</a> and{' '}
                  <a href="#">Privacy Policy</a>.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}
