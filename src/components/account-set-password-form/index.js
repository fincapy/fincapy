'use client';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePassword } from './serverActions';
import { Loader2, CheckCircle } from 'lucide-react';
import SubmitButton from '../SubmitButton';

const AccountSetPasswordForm = ({ onSuccess, onCancel, onTokenInvalid }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const result = await updatePassword(password);
    setIsSubmitting(false);

    if (!result) {
      setError('Failed to update password. Please try again.');
      return;
    }

    if (result.success === false) {
      if (result.tokenInvalid) {
        // Handle invalid token - return to reauth
        if (onTokenInvalid && typeof onTokenInvalid === 'function') {
          onTokenInvalid();
        }
        return;
      }

      setError(
        result.message || 'Failed to update password. Please try again.'
      );
      return;
    }

    setIsSuccess(true);

    // Notify parent component of success
    setTimeout(() => {
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess();
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-1 w-full">
      <div className="flex flex-col gap-6 w-full items-center mt-6">
        <Card className="bg-card w-full flex flex-col items-center border">
          <CardContent className="pt-6 w-full">
            <form onSubmit={handleSubmit}>
              <div className="grid gap-6">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoFocus
                      disabled={isSubmitting || isSuccess}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={isSubmitting || isSuccess}
                    />
                  </div>
                  {error && (
                    <div className="text-destructive text-sm">{error}</div>
                  )}
                  {isSuccess && (
                    <div className="flex items-center text-sm text-primary">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Password updated successfully!</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={onCancel}
                      disabled={isSubmitting || isSuccess}
                    >
                      Cancel
                    </Button>
                    <SubmitButton
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting || isSuccess}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        'Update Password'
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
};

export { AccountSetPasswordForm };
