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
    return { success: false, message: 'Session not found' };
  }

  // Validate and sanitize password
  try {
    passwordSchema.parse(newPassword);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.log('Password validation error in updatePassword');
    return { success: false, message: 'Invalid password format' };
  }

  const sanitizedPassword = sanitizeInput(newPassword);

  // Get highRiskActionValidatedToken from cookies
  const cookieStore = await cookies();
  const highRiskActionValidatedToken = cookieStore.get(
    'highRiskActionValidatedToken'
  )?.value;

  if (!highRiskActionValidatedToken) {
    console.log('Missing highRiskActionValidatedToken');
    return { success: false, tokenInvalid: true };
  }

  // Verify the token
  let verifiedToken;
  try {
    verifiedToken = jwt.verify(
      highRiskActionValidatedToken,
      process.env.JWT_SECRET,
      {
        algorithms: ['HS256'],
      }
    );
  } catch (error) {
    console.log('Invalid or expired highRiskActionValidatedToken');
    return { success: false, tokenInvalid: true };
  }

  // Validate token type
  if (verifiedToken.type !== 'highRiskActionValidated') {
    console.log('Invalid token type - expected highRiskActionValidated');
    return { success: false, tokenInvalid: true };
  }

  // Ensure token userId matches session userId
  if (verifiedToken.userId !== session.userId) {
    console.log('Token userId does not match session userId');
    return { success: false, tokenInvalid: true };
  }

  // Get the user
  const user = await userRepository.get({ userId: session.userId });

  if (!user) {
    console.log('User not found');
    return { success: false, message: 'User not found' };
  }

  // Hash and update the password
  const hashedPassword = await bcrypt.hash(sanitizedPassword, 12);
  user.password = hashedPassword;

  // Save the updated user
  await userRepository.set({
    userId: user.id,
    user,
  });

  // Clear the highRiskActionValidatedToken
  cookieStore.delete('highRiskActionValidatedToken');

  return { success: true };
}
