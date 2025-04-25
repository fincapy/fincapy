'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { authenticateForHighRiskAction } from './serverActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import SubmitButton from '../SubmitButton';

export function SignInReauthForm({ email, onSuccess, onCancel, className }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    const result = await authenticateForHighRiskAction({ email, password });
    setLoading(false);

    if (result) {
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    } else {
      setError('Invalid password');
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
          <CardContent className="pt-6 w-full">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="password">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex gap-2">
                    {onCancel && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={onCancel}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
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
                        'Confirm'
                      )}
                    </SubmitButton>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
