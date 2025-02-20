'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { setInitialPassword } from './serverActions';

const SetPasswordForm = () => {
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const getTimeLeft = () => {
    if (typeof window !== 'undefined') {
      const timestamp = sessionStorage.getItem('resetPasswordTimestamp');
      if (timestamp) {
        const elapsed = Math.floor(
          (Date.now() - parseInt(timestamp, 10)) / 1000
        );
        const remaining = Math.max(0, 600 - elapsed);
        return remaining;
      }
    }
    return 600;
  };

  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft());
  const timerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (timeLeft > 0) {
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            const newTime = prev - 1;
            if (newTime <= 0) {
              clearInterval(timerRef.current);
              sessionStorage.removeItem('resetPasswordTimestamp');
              router.push('/signin');
            }
            return Math.max(0, newTime);
          });
        }, 1000);
        return () => clearInterval(timerRef.current);
      }
    }
  }, [timeLeft, router]);

  if (!mounted) {
    return <div className="w-[384px] h-[300px] bg-card rounded-xl" />;
  }

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

    try {
      setError('');
      setIsSubmitting(true);
      const result = await setInitialPassword(password);

      if (result) {
        sessionStorage.removeItem('resetPasswordTimestamp');
        router.push('/signin');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Password reset error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-[384px] bg-background shadow-lg">
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
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            Reset Password
          </Button>
          {timeLeft > 0 && (
            <div className="flex justify-center">
              <span className="text-xs text-muted-foreground">
                {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, '0')} remaining
              </span>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export { SetPasswordForm };
