'use server';

import { AddEmailAddressService } from '@/backend/services/addEmailAddressService';
import { EmailVerificationCodeRepository } from '@/backend/adapters/repositories/emailVerificationCodeRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SESAdapter } from '@/backend/adapters/sesAdapter';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { SetPrimaryEmailService } from '@/backend/services/setPrimaryEmailService';
import { RemoveEmailService } from '@/backend/services/removeEmailService';
import { verifyHighRiskActionToken } from '@/utils/auth';
import { ChangeUserNameService } from '@/backend/services/changeUserNameService';
import { redirect } from 'next/navigation';

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

function hashEmail(email) {
  return crypto.createHash('sha256').update(email).digest('hex');
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
      console.log('No session found');
      return redirect('/signin');
    }

    const userId = session.userId;
    if (!userId) {
      console.log('No user ID found');
      return { success: false, error: 'Unauthenticated' };
    }

    // Verify high-risk action token
    const authToken = await verifyHighRiskActionToken();
    if (!authToken || authToken.userId !== userId) {
      console.log('Invalid auth token');
      return {
        success: false,
        error: 'Unauthenticated',
        requiresAuth: true,
      };
    }

    // Validate and sanitize email
    try {
      const sanitizedEmail = sanitizeInput(email);
      const validationResult = emailSchema.safeParse(sanitizedEmail);
      if (!validationResult.success) {
        console.log('Invalid email address');
        return {
          success: false,
          error:
            validationResult.error.errors[0]?.message ||
            'Invalid email address',
        };
      }
      email = validationResult.data;
    } catch (error) {
      console.log('Email validation failed');
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
      console.log('Add email error:', error);
      return { success: false, error: 'Failed to add email address' };
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
    const verificationKey = `${userId}:${hashEmail(email)}`;

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
    console.error('Add email error:');
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
      console.log('No session found');
      return redirect('/signin');
    }

    const userId = session.userId;
    if (!userId) {
      console.log('No user ID found');
      return { success: false, error: 'Unauthenticated' };
    }

    // Validate and sanitize input data
    try {
      const sanitizedEmail = sanitizeInput(email);
      const emailValidation = emailSchema.safeParse(sanitizedEmail);
      if (!emailValidation.success) {
        console.log('Invalid email address');
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
        console.log('Invalid verification code');
        return {
          success: false,
          error: 'Invalid verification code',
        };
      }
      verificationCode = codeValidation.data;
    } catch (error) {
      console.log('Input validation failed');
      return { success: false, error: 'Input validation failed' };
    }

    // Create the verification key that includes the email
    const verificationKey = `${userId}:${hashEmail(email)}`;

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
      console.log('No stored code found');
      return {
        success: false,
        error: 'Invalid verification code',
      };
    }

    if (storedCode !== parseInt(verificationCode, 10)) {
      console.log('Invalid verification code');
      return {
        success: false,
        error: 'Invalid verification code',
      };
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
      console.log('Email address not found on account');
      return {
        success: false,
        error: 'Unexpected error',
      };
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
      console.log('No session found');
      return redirect('/signin');
    }

    const userId = session.userId;
    if (!userId) {
      console.log('No user ID found');
      return { success: false, error: 'Unauthenticated' };
    }

    // Validate and sanitize email
    try {
      const sanitizedEmail = sanitizeInput(email);
      const validationResult = emailSchema.safeParse(sanitizedEmail);
      if (!validationResult.success) {
        console.log('Invalid email address');
        return {
          success: false,
          error:
            validationResult.error.errors[0]?.message ||
            'Invalid email address',
        };
      }
      email = validationResult.data;
    } catch (error) {
      console.log('Email validation failed');
      return { success: false, error: 'Email validation failed' };
    }

    // Verify this email belongs to the user
    const userRepository = new UserRepository({ redisAdapter });
    const user = await userRepository.get({ userId });

    const emailEntry = user.emails.find((e) => e.email === email);
    if (!emailEntry) {
      console.log('Email address not found on account');
      return {
        success: false,
        error: 'Unexpected error',
      };
    }

    if (emailEntry.verified) {
      console.log('Email address is already verified');
      return {
        success: false,
        error: 'Email address is already verified',
      };
    }

    // Generate and store verification code
    const emailVerificationCode = crypto.randomInt(100000, 999999);
    const emailVerificationCodeRepository = new EmailVerificationCodeRepository(
      {
        redisAdapter,
      }
    );

    // Create a special verification key that includes the email
    const verificationKey = `${userId}:${hashEmail(email)}`;

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

/**
 * Set an email address as the primary email for the user's account
 * @param {string} email - The email address to set as primary
 * @returns {Promise<Object>} - Result of the operation
 */
export async function setPrimaryEmail(email) {
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
      console.log('No session found');
      return redirect('/signin');
    }

    const userId = session.userId;
    if (!userId) {
      console.log('No user ID found');
      return { success: false, error: 'Unauthenticated' };
    }

    // Verify high-risk action token
    const authToken = await verifyHighRiskActionToken();
    if (!authToken || authToken.userId !== userId) {
      console.log('Invalid auth token');
      return {
        success: false,
        error: 'Unauthenticated',
        requiresAuth: true,
      };
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

    // Set email as primary
    const transactionManager = new TransactionManager();
    const setPrimaryEmailService = new SetPrimaryEmailService({
      transactionManager,
    });

    try {
      await setPrimaryEmailService.execute({
        userId,
        email,
      });
    } catch (error) {
      return { success: false, error: 'Unexpected error' };
    }

    return { success: true };
  } catch (error) {
    console.error('Set primary email error:', error);
    return { success: false, error: 'Failed to set primary email address' };
  }
}

/**
 * Remove an email address from the user's account
 * @param {string} email - The email address to remove
 * @returns {Promise<Object>} - Result of the operation
 */
export async function removeEmail(email) {
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
      console.log('No session found');
      return redirect('/signin');
    }

    const userId = session.userId;
    if (!userId) {
      console.log('No user ID found');
      return { success: false, error: 'Unauthenticated' };
    }

    // Verify high-risk action token
    const authToken = await verifyHighRiskActionToken();
    if (!authToken || authToken.userId !== userId) {
      console.log('Invalid auth token');
      return {
        success: false,
        error: 'Unauthenticated',
        requiresAuth: true,
      };
    }

    // Validate and sanitize email
    try {
      const sanitizedEmail = sanitizeInput(email);
      const validationResult = emailSchema.safeParse(sanitizedEmail);
      if (!validationResult.success) {
        console.log('Invalid email address');
        return {
          success: false,
          error:
            validationResult.error.errors[0]?.message ||
            'Invalid email address',
        };
      }
      email = validationResult.data;
    } catch (error) {
      console.log('Email validation failed');
      return { success: false, error: 'Email validation failed' };
    }

    // Remove the email
    const transactionManager = new TransactionManager();
    const removeEmailService = new RemoveEmailService({
      transactionManager,
    });

    try {
      await removeEmailService.execute({
        userId,
        email,
      });
    } catch (error) {
      console.log('Remove email error:', error);
      return { success: false, error: 'Unexpected error' };
    }

    return { success: true };
  } catch (error) {
    console.error('Remove email error:', error);
    return { success: false, error: 'Failed to remove email address' };
  }
}

/**
 * Change the current user's name
 * @param {string} name - The new name for the user
 * @returns {Promise<Object>} - Result of the operation
 */
export async function changeUserName(name) {
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
      console.log('No session found');
      return redirect('/signin');
    }

    const userId = session.userId;
    if (!userId) {
      console.log('No user ID found');
      return { success: false, error: 'Unauthenticated' };
    }

    // Sanitize name input
    const sanitizedName = sanitizeInput(name);
    if (!sanitizedName || sanitizedName.trim().length === 0) {
      return { success: false, error: 'Name cannot be empty' };
    }

    // Change the user's name
    const transactionManager = new TransactionManager();
    const changeUserNameService = new ChangeUserNameService({
      transactionManager,
    });

    try {
      await changeUserNameService.execute({
        userId,
        tenantId: session.tenantId,
        name: sanitizedName,
      });
    } catch (error) {
      console.log('Change name error:', error);
      return { success: false, error: 'Failed to change name' };
    }

    return { success: true };
  } catch (error) {
    console.error('Change name error:', error);
    return { success: false, error: 'Unexpected error' };
  }
}
