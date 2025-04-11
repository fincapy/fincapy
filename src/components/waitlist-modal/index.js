'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { addToWaitlist } from '@/components/waitlist-modal/serverActions';

// Email validation schema using zod
const waitlistSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export function WaitlistModal({ open, onOpenChange }) {
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: '',
    },
  });

  function onSubmit(data) {
    startTransition(async () => {
      const result = await addToWaitlist(data.email);
      if (result.success) {
        setSubmitted(true);

        // Auto-close after showing success message
        setTimeout(() => {
          setSubmitted(false);
          form.reset();
          onOpenChange(false);
        }, 3000);
      } else {
        form.setError('email', {
          type: 'server',
          message: result.error || 'Something went wrong. Please try again.',
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[96%]rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Join our waitlist
          </DialogTitle>
          <DialogDescription>
            {submitted
              ? "Thanks for joining our waitlist! We'll be in touch soon."
              : 'Be the first to know when Fincapy launches. Enter your email below.'}
          </DialogDescription>
        </DialogHeader>

        {!submitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="your@email.com"
                        type="email"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  className="w-full bg-primary text-white hover:bg-primary-dark"
                  disabled={isPending}
                >
                  {isPending ? 'Submitting...' : 'Join Waitlist'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex items-center justify-center py-2">
            <div className="text-primary text-xl">✓ Thanks for joining!</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
