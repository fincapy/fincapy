'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { setInitialPassword, resetPassword } from './serverActions';
import { Loader2, CheckCircle } from 'lucide-react';
import SubmitButton from '../SubmitButton';

const SetPasswordForm = ({ token, isReset }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password complexity
    const minLength = password.length >= 8;
    if (!minLength) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Check for character type requirements
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecials = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const typeCount = [
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecials,
    ].filter(Boolean).length;

    if (typeCount < 3) {
      setError(
        'Password must contain at least 3 of 4 character types: uppercase, lowercase, numbers, and special characters'
      );
      return;
    }

    setError('');
    setIsSubmitting(true);
    let result;
    if (isReset) {
      result = await resetPassword(password, token);
    } else {
      result = await setInitialPassword(password, token);
    }
    setIsSubmitting(false);
    if (!result) {
      setError('Failed to reset password. Please try again.');
    } else {
      setIsSuccess(true);
      // Wait 2 seconds to show the success message before redirecting
      setTimeout(() => {
        router.push('/signin');
      }, 1500);
    }
  };

  return (
    <Card className="w-[384px] bg-background border">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {isSuccess && (
            <div className="flex items-center text-sm text-primary">
              <CheckCircle className="mr-2 h-4 w-4" />
              <span>
                Password {isReset ? 'reset' : 'set'} successfully! Redirecting
                to sign in...
              </span>
            </div>
          )}
          <SubmitButton
            type="submit"
            className="w-full text-sm"
            disabled={isSubmitting || isSuccess}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>{isReset ? 'Reset Password' : 'Set Password'}</>
            )}
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
};

export { SetPasswordForm };
