'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LockKeyhole, Loader2 } from 'lucide-react';
import { createContext, useContext } from 'react';
import { verifyAccessCode } from './serverActions';
import Image from 'next/image';

export const AccessCodeContext = createContext();

export function AccessGate({ children }) {
  const [accessCode, setAccessCode] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await verifyAccessCode(accessCode);
    if (result) {
      setIsVerified(true);
    } else {
      setError('Invalid access code');
    }
    setLoading(false);
  };

  if (isVerified) {
    return (
      <AccessCodeContext.Provider value={accessCode}>
        {children}
      </AccessCodeContext.Provider>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center justify-center">
          <Image
            src="/capybara.png"
            alt="Fincapy"
            width={64}
            height={64}
            className="rounded-full"
          />
        </div>
        <Card className="bg-card border">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Site Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <Input
                  type="password"
                  placeholder="Enter access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                />
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    'Access Site'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
