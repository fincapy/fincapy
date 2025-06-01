'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { authenticateForHighRiskAction } from './serverActions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import SubmitButton from '../SubmitButton';
import { GoogleSignInButton } from '@/components/ui/google-signin-button';
import { Separator } from '@/components/ui/separator';

export function SignInReauthForm({
  email,
  onSuccess,
  onCancel,
  className,
  authProvider = 'email',
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Listen for URL changes after Google OAuth completion
  useEffect(() => {
    if (authProvider === 'google') {
      const checkForAuthSuccess = () => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('auth') === 'success') {
          // Clean up URL parameters
          const url = new URL(window.location);
          url.searchParams.delete('auth');
          window.history.replaceState({}, '', url);

          // Call success callback
          if (onSuccess && typeof onSuccess === 'function') {
            onSuccess();
          }
        } else if (urlParams.get('error')) {
          const errorType = urlParams.get('error');
          let errorMessage = 'Authentication failed';
          if (errorType === 'authentication_mismatch') {
            errorMessage = 'Authentication failed: Account mismatch';
          } else if (errorType === 'authentication_failed') {
            errorMessage = 'Authentication failed: Please try again';
          }
          setError(errorMessage);
          setLoading(false);

          // Clean up URL parameters
          const url = new URL(window.location);
          url.searchParams.delete('error');
          window.history.replaceState({}, '', url);
        }
      };

      // Check immediately in case we're already on the success page
      checkForAuthSuccess();

      // Also listen for popstate events (back/forward navigation)
      window.addEventListener('popstate', checkForAuthSuccess);

      return () => {
        window.removeEventListener('popstate', checkForAuthSuccess);
      };
    }
  }, [authProvider, onSuccess]);

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

  const handleGoogleAuth = () => {
    setLoading(true);

    // Save the current state to sessionStorage so it can be restored after OAuth
    // The account dashboard needs to know what action was being performed
    const currentState = {
      timestamp: Date.now(),
      page: 'account', // We know this is for account page high-risk actions
      isHighRiskActionModalOpen: true,
      authStep: 'action', // After successful OAuth, go directly to action step
    };

    try {
      sessionStorage.setItem('postOAuthState', JSON.stringify(currentState));
    } catch (error) {
      console.warn('Failed to save OAuth state to sessionStorage:', error);
    }

    // Redirect to Google OAuth for high risk action
    window.location.href = '/api/auth/google/high-risk-action';
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
            {authProvider === 'google' ? (
              // Google OAuth users
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
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <GoogleSignInButton
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      'Continue with Google'
                    )}
                  </GoogleSignInButton>
                  <div className="flex gap-2 mt-2">
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
                  </div>
                </div>
              </div>
            ) : (
              // Email/Password users
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
