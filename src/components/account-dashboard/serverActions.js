'use server';

import { AddEmailAddressService } from '@/backend/services/addEmailAddressService';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { headers, cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';

// Create validation schema for email
const emailSchema = z
  .string()
  .email({ message: 'Invalid email address' })
  .max(255, { message: 'Email address is too long' });

// Create validation schema for verification code
const verificationCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: 'Verification code must be a 6-digit number' });

// Sanitize inputs to prevent XSS
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

/**
 * Add a new email address to the user's account and send verification code
 * @param {string} email - The email address to add
 * @returns {Promise<Object>} - Result of the operation
 */
export async function addEmailAddress(email) {
  try {
    // Get current user token
    const cookiesList = await cookies();

    // Set up session manager
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });

    const session = await sessionManager.getSession({
      cookies: cookiesList,
    });

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const userId = session.userId;
    if (!userId) {
      return { success: false, error: 'Invalid session data' };
    }

    // Validate and sanitize email
    try {
      const sanitizedEmail = sanitizeInput(email);
      const validationResult = emailSchema.safeParse(sanitizedEmail);
      if (!validationResult.success) {
        return {
          success: false,
          error:
            validationResult.error.errors[0]?.message ||
            'Invalid email address',
        };
      }
      email = validationResult.data;
    } catch (error) {
      return { success: false, error: 'Email validation failed' };
    }

    // Add email to the user's account
    const transactionManager = new TransactionManager();
    const addEmailAddressService = new AddEmailAddressService({
      transactionManager,
    });

    try {
      await addEmailAddressService.execute({
        userId,
        email,
        isPrimary: false,
      });
    } catch (error) {
      return { success: false, error: error.message };
    }

    // Generate and store verification code
    const emailVerificationCode = crypto.randomInt(100000, 999999);
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
      }
    );

    // Create a special verification key that includes the email
    // This allows multiple email verifications at once
    const verificationKey = `${userId}:${email}`;

    await emailVerificationCodeRepository.set({
      emailVerificationCode,
      userId: verificationKey,
      ttl: 60 * 10, // 10 minutes
    });

    // Send verification email
    if (process.env.NODE_ENV === 'production') {
      const sesAdapter = new SESAdapter();
      await sesAdapter.sendEmail({
        to: email,
        subject: 'Verify your email address on Fincapy',
        text: `Your verification code is: ${emailVerificationCode}\n\nThis code will expire in 10 minutes.`,
      });
    } else {
      console.log(
        'Email verification code for new address:',
        emailVerificationCode
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Add email error:', error);
    return { success: false, error: 'Failed to add email address' };
  }
}

/**
 * Verify an email address using the verification code
 * @param {string} email - The email address to verify
 * @param {string} verificationCode - The verification code
 * @returns {Promise<Object>} - Result of the operation
 */
export async function verifyEmailAddress(email, verificationCode) {
  try {
    // Get current user token
    const cookiesList = await cookies();

    // Set up session manager
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });

    const session = await sessionManager.getSession({
      cookies: cookiesList,
    });

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const userId = session.userId;
    if (!userId) {
      return { success: false, error: 'Invalid session data' };
    }

    // Validate and sanitize input data
    try {
      const sanitizedEmail = sanitizeInput(email);
      const emailValidation = emailSchema.safeParse(sanitizedEmail);
      if (!emailValidation.success) {
        return {
          success: false,
          error:
            emailValidation.error.errors[0]?.message || 'Invalid email address',
        };
      }
      email = emailValidation.data;

      const sanitizedCode = sanitizeInput(verificationCode);
      const codeValidation = verificationCodeSchema.safeParse(sanitizedCode);
      if (!codeValidation.success) {
        return {
          success: false,
          error:
            codeValidation.error.errors[0]?.message ||
            'Invalid verification code',
        };
      }
      verificationCode = codeValidation.data;
    } catch (error) {
      return { success: false, error: 'Input validation failed' };
    }

    // Create the verification key that includes the email
    const verificationKey = `${userId}:${email}`;

    // Retrieve and validate verification code
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
      }
    );

    const storedCode = await emailVerificationCodeRepository.get({
      userId: verificationKey,
    });

    if (!storedCode) {
      return {
        success: false,
        error: 'Verification code not found or expired',
      };
    }

    if (storedCode !== parseInt(verificationCode, 10)) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Delete the verification code since it's been used
    await emailVerificationCodeRepository.delete({
      userId: verificationKey,
    });

    // Update the user's email to mark it as verified
    const userRepository = new UserRepository({ redisAdapter });
    const user = await userRepository.get({ userId });

    const emailToVerify = user.emails.find((e) => e.email === email);
    if (!emailToVerify) {
      return { success: false, error: 'Email address not found on account' };
    }

    emailToVerify.verified = true;
    await userRepository.set({ userId, user });
    await userRepository.incrementVersion({ userId });

    return { success: true };
  } catch (error) {
    console.error('Verify email error:', error);
    return { success: false, error: 'Failed to verify email address' };
  }
}

/**
 * Resend verification code for an unverified email
 * @param {string} email - The email address to resend verification for
 * @returns {Promise<Object>} - Result of the operation
 */
export async function resendEmailVerification(email) {
  try {
    // Get current user token
    const cookiesList = await cookies();

    // Set up session manager
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });

    const session = await sessionManager.getSession({
      cookies: cookiesList,
    });

    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const userId = session.userId;
    if (!userId) {
      return { success: false, error: 'Invalid session data' };
    }

    // Validate and sanitize email
    try {
      const sanitizedEmail = sanitizeInput(email);
      const validationResult = emailSchema.safeParse(sanitizedEmail);
      if (!validationResult.success) {
        return {
          success: false,
          error:
            validationResult.error.errors[0]?.message ||
            'Invalid email address',
        };
      }
      email = validationResult.data;
    } catch (error) {
      return { success: false, error: 'Email validation failed' };
    }

    // Verify this email belongs to the user
    const userRepository = new UserRepository({ redisAdapter });
    const user = await userRepository.get({ userId });

    const emailEntry = user.emails.find((e) => e.email === email);
    if (!emailEntry) {
      return { success: false, error: 'Email address not found on account' };
    }

    if (emailEntry.verified) {
      return { success: false, error: 'Email address is already verified' };
    }

    // Generate and store verification code
    const emailVerificationCode = crypto.randomInt(100000, 999999);
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
      }
    );

    // Create a special verification key that includes the email
    const verificationKey = `${userId}:${email}`;

    await emailVerificationCodeRepository.set({
      emailVerificationCode,
      userId: verificationKey,
      ttl: 60 * 10, // 10 minutes
    });

    // Send verification email
    if (process.env.NODE_ENV === 'production') {
      const sesAdapter = new SESAdapter();
      await sesAdapter.sendEmail({
        to: email,
        subject: 'Verify your email address on Fincapy',
        text: `Your verification code is: ${emailVerificationCode}\n\nThis code will expire in 10 minutes.`,
      });
    } else {
      console.log('Email verification code for resend:', emailVerificationCode);
    }

    return { success: true };
  } catch (error) {
    console.error('Resend verification error:', error);
    return { success: false, error: 'Failed to resend verification code' };
  }
}
