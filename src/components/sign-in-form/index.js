'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { authenticateEmailPassword } from './serverActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Prevent flash by waiting for client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

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
      sessionStorage.setItem('emailPasswordCountdown', Date.now().toString());
      const result = await authenticateEmailPassword({ email, password });
      if (!result) {
        setError('Invalid email or password');
      }
    } catch (err) {
      if (err.message.includes('Too many login attempts')) {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError('Invalid email or password');
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center -mt-4 gap-1",
      !mounted && "opacity-0",
      mounted && "animate-in fade-in duration-300"
    )}>
      <div className="flex flex-col items-center gap-0 mb-2">
        <h2 className="text-2xl text-center font-semibold tracking-tight">
          Welcome back!
        </h2>
      </div>
      <div className="flex flex-col gap-6">
        <Card className="bg-background">
          <CardContent className="pt-6 w-[384px]">
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
                  <Button type="submit" className="w-full" disabled={loading}>
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
      </div>
    </div>
  );
}
