'use server';

import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Define Zod schemas for validation
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
  try {
    passwordSchema.parse(newPassword);
    tokenSchema.parse(token);

    // Sanitize inputs
    const sanitizedPassword = sanitizeInput(newPassword);
    const sanitizedToken = sanitizeInput(token);

    let verifiedToken;
    try {
      verifiedToken = await jwt.verify(sanitizedToken, process.env.JWT_SECRET);
    } catch (error) {
      return false;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return false;
  }
  if (verifiedToken.type !== 'inviteUser') {
    return false;
  }
  const userId = verifiedToken.userId;

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId });

  if (!user) {
    return false;
  }

  // Hash and set the initial password
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
    { expiresIn: '10m' }
  );
  (await cookies()).set(
    'emailPasswordAuthenticatedToken',
    emailPasswordAuthenticatedToken,
    {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10,
    }
  );

  await userRepository.set({
    userId,
    user,
  });
  redirect('/register-totp');
}

export async function resetPassword(newPassword, token) {
  // Validate and sanitize inputs
  let sanitizedPassword;
  try {
    passwordSchema.parse(newPassword);
    tokenSchema.parse(token);

    // Sanitize inputs
    sanitizedPassword = sanitizeInput(newPassword);
    const sanitizedToken = sanitizeInput(token);

    let verifiedToken;
    try {
      verifiedToken = await jwt.verify(sanitizedToken, process.env.JWT_SECRET);
    } catch (error) {
      return false;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    return false;
  }
  if (verifiedToken.type !== 'resetPassword') {
    return false;
  }
  const userId = verifiedToken.userId;

  const redisAdapter = new RedisAdapter({ redisClient });
  const userRepository = new UserRepository({ redisAdapter });
  const user = await userRepository.get({ userId });

  if (!user) {
    return false;
  }

  // Hash and set the initial password
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
    { expiresIn: '10m' }
  );
  (await cookies()).set(
    'emailPasswordAuthenticatedToken',
    emailPasswordAuthenticatedToken,
    {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 10,
    }
  );
  await userRepository.set({
    userId,
    user,
  });
  return true;
}
