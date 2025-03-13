'use server';

import { redisClient, RedisAdapter } from '@/backend/adapters/redisAdapter';
import { WaitlistRepository } from '@/backend/adapters/repositories/waitlistRepository';

export async function addToWaitlist(email) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const waitlistRepository = new WaitlistRepository({ redisAdapter });
  try {
    await waitlistRepository.addToWaitlist({ email });
    return { success: true };
  } catch (error) {
    console.error('Failed to add email to waitlist:', error);
    return {
      success: false,
      error: 'Failed to add to waitlist. Please try again later.',
    };
  }
}
