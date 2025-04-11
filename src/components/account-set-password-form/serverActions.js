'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SessionManager } from '@/backend/adapters/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { verifyHighRiskActionToken } from '@/utils/auth';

// Define Zod schema for password validation
const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(100, { message: 'Password is too long' })
  .regex(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  .regex(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' })
  .regex(/[^A-Za-z0-9]/, {
    message: 'Password must contain at least one special character',
  });

// Sanitize function to remove any HTML
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

export async function updatePassword(newPassword) {
  // Initialize required services
  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });

  // Touch the session to keep it active
  const session = await sessionManager.touchSession({
    cookies: await cookies(),
  });

  if (!session) {
    console.log('No active session found in updatePassword');
    return { success: false, message: 'Unauthenticated' };
  }

  // Validate and sanitize password
  try {
    passwordSchema.parse(newPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.log('Password validation error in updatePassword');
    return { success: false, message: 'Invalid password' };
  }

  // Verify high-risk action token
  const authToken = await verifyHighRiskActionToken();
  if (!authToken || authToken.userId !== session.userId) {
    return {
      success: false,
      message: 'Unauthenticated',
      tokenInvalid: true,
    };
  }

  // Get the user
  const user = await userRepository.get({ userId: session.userId });

  if (!user) {
    console.log('User not found');
    return { success: false, message: 'Unexpected error' };
  }

  // Hash and update the password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;

  // Save the updated user
  await userRepository.set({
    userId: user.id,
    user,
  });

  return { success: true };
}
