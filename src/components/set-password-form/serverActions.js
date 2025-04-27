'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { TransactionManager } from '@/backend/adapters/transactionManager';

// Define Zod schemas for validation
const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(100, { message: 'Password is too long' })
  .refine(
    (password) => {
      // Check for at least 3 of 4 character types
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasNumbers = /[0-9]/.test(password);
      const hasSpecials = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
        password
      );

      const typeCount = [
        hasUppercase,
        hasLowercase,
        hasNumbers,
        hasSpecials,
      ].filter(Boolean).length;

      return typeCount >= 3;
    },
    {
      message:
        'Password must contain at least 3 of 4 character types: uppercase, lowercase, numbers, and special characters',
    }
  );

const tokenSchema = z.string().min(10);

// Sanitize function to remove any HTML
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

export async function setInitialPassword(newPassword, token) {
  // Validate and sanitize inputs
  let verifiedToken;
  let sanitizedPassword;
  let sanitizedToken;
  try {
    passwordSchema.parse(newPassword);
    tokenSchema.parse(token);

    // Sanitize inputs
    sanitizedPassword = sanitizeInput(newPassword);
    sanitizedToken = sanitizeInput(token);

    try {
      verifiedToken = await jwt.verify(sanitizedToken, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      console.log('Invalid or expired token in setInitialPassword');
      return false;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.log('Validation error in setInitialPassword');
    return false;
  }
  if (verifiedToken.type !== 'inviteUser') {
    console.log(
      'Invalid token type in setInitialPassword - expected inviteUser'
    );
    return false;
  }
  const userId = verifiedToken.userId;

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId });

  if (!user) {
    console.log('User not found in setInitialPassword');
    return false;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(sanitizedPassword, 12);
  user.password = hashedPassword;
  user.emails[0].verified = true;

  const emailPasswordAuthenticatedToken = jwt.sign(
    {
      userId: user.id,
      mfaMethod: user.mfa_method,
      emailVerified: true,
      tenantId: user.tenantId,
      type: 'emailPasswordAuthenticated',
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m', algorithm: 'HS256' }
  );
  (await cookies()).set(
    'emailPasswordAuthenticatedToken',
    emailPasswordAuthenticatedToken,
    {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10 * 1000, // 10 minutes
    }
  );

  // Use transaction manager to update user and delete sessions atomically
  const transactionManager = new TransactionManager();
  await transactionManager.transaction(
    async ({ userRepository, sessionRepository }) => {
      await userRepository.set({
        userId,
        user,
      });

      // Terminate all active sessions for this user
      const userSessions = await sessionRepository.getUserSessions(userId);
      for (const userSession of userSessions) {
        await sessionRepository.delete({ sessionId: userSession.sessionId });
      }
    }
  );

  redirect('/register-totp');
}

export async function resetPassword(newPassword, token) {
  // Validate and sanitize inputs
  let sanitizedPassword;
  let verifiedToken;
  try {
    passwordSchema.parse(newPassword);
    tokenSchema.parse(token);

    // Sanitize inputs
    sanitizedPassword = sanitizeInput(newPassword);
    const sanitizedToken = sanitizeInput(token);

    try {
      verifiedToken = await jwt.verify(sanitizedToken, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      console.log('Invalid or expired token in resetPassword');
      return false;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('Validation error in resetPassword');
      return false;
    }
    console.log('Validation error in resetPassword');
    return false;
  }
  if (verifiedToken.type !== 'resetPassword') {
    console.log('Invalid token type in resetPassword - expected resetPassword');
    return false;
  }
  const userId = verifiedToken.userId;

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId });

  if (!user) {
    console.log('User not found in resetPassword');
    return false;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(sanitizedPassword, 12);
  user.password = hashedPassword;
  user.emails[0].verified = true;

  const emailPasswordAuthenticatedToken = jwt.sign(
    {
      userId: user.id,
      mfaMethod: user.mfa_method,
      emailVerified: true,
      tenantId: user.tenantId,
      type: 'emailPasswordAuthenticated',
    },
    process.env.JWT_SECRET,
    { expiresIn: '10m', algorithm: 'HS256' }
  );
  (await cookies()).set(
    'emailPasswordAuthenticatedToken',
    emailPasswordAuthenticatedToken,
    {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10 * 1000, // 10 minutes
    }
  );

  // Use transaction manager to update user and delete sessions atomically
  const transactionManager = new TransactionManager();
  await transactionManager.transaction(
    async ({ userRepository, sessionRepository }) => {
      await userRepository.set({
        userId,
        user,
      });

      // Terminate all active sessions for this user
      const userSessions = await sessionRepository.getUserSessions(userId);
      for (const userSession of userSessions) {
        await sessionRepository.delete({ sessionId: userSession.sessionId });
      }
    }
  );

  return true;
}
