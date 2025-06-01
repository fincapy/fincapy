'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import {
  EmailPasswordAuthenticator,
  SessionManager,
} from '@/backend/adapters/auth';
import { AuthRateLimiter } from '@/backend/adapters/rateLimiter';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { UserRepository } from '@/backend/adapters/repositories/userRepository';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redirect } from 'next/navigation';
import speakeasy from 'speakeasy';
import { verifyBackupCode } from '@/utils/backupCodes';
import {
  totpSchema,
  backupCodeSchema,
  validateAndSanitize,
} from '@/utils/validation';

// Input validation schemas
const emailPasswordSchema = z.object({
  email: z.string().email().trim().max(255),
  password: z.string().min(8).max(100),
});

// Sanitize function for string inputs
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'recursiveEscape',
  });
}

async function authenticateForMerge(rawInput) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new AuthRateLimiter({ redisAdapter });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  return await rateLimiter.withRateLimit(
    { ip, processId: 'authenticateForMerge', userId: rawInput.email },
    async () => {
      // Verify the Google merge token exists and is valid
      const googleAccountMergeToken = (await cookies()).get(
        'googleAccountMergeToken'
      );
      if (!googleAccountMergeToken) {
        console.log('Missing Google merge token');
        return { success: false, error: 'Merge session expired' };
      }

      let mergeTokenData;
      try {
        mergeTokenData = jwt.verify(
          googleAccountMergeToken.value,
          process.env.JWT_SECRET,
          { algorithms: ['HS256'] }
        );
      } catch (error) {
        console.log('Invalid Google merge token');
        return { success: false, error: 'Merge session expired' };
      }

      if (mergeTokenData.type !== 'googleAccountMerge') {
        console.log('Invalid merge token type');
        return { success: false, error: 'Merge session expired' };
      }

      const sanitizedInput = {
        email: rawInput.email,
        password: rawInput.password, // Don't sanitize password as it may contain special characters
      };

      let email;
      let password;
      try {
        const result = emailPasswordSchema.parse(sanitizedInput);
        email = result.email;
        password = result.password;
      } catch (error) {
        console.log('Email/password validation failed for merge');
        return { success: false, error: 'Invalid email or password format' };
      }

      // Verify the email matches the existing user in merge token
      const userRepository = new UserRepository({ redisAdapter });
      const existingUser = await userRepository.get({
        userId: mergeTokenData.existingUserId,
      });

      if (!existingUser) {
        console.log('Existing user not found during merge');
        return { success: false, error: 'User not found' };
      }

      // Verify email matches
      const userEmail = existingUser.emails.find(
        (emailInfo) => emailInfo.email === email
      );
      if (!userEmail) {
        console.log('Email does not match user in merge token');
        return { success: false, error: 'Email does not match account' };
      }

      // Authenticate password
      const authenticator = new EmailPasswordAuthenticator({
        userRepository,
      });

      const passwordResult = await authenticator.authenticate({
        unauthenticatedPassword: password,
        password: existingUser.password,
      });

      if (!passwordResult) {
        console.log('Invalid password during merge authentication');
        return { success: false, error: 'Invalid email or password' };
      }

      // Create an intermediate authentication token
      const mergeAuthToken = jwt.sign(
        {
          type: 'mergeAuthenticated',
          userId: existingUser.id,
          tenantId: existingUser.tenantId,
          mergeTokenId: mergeTokenData.existingUserId, // Link to original merge request
          requiresTOTP: existingUser.totpEnabled || false,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      (await cookies()).set('mergeAuthenticatedToken', mergeAuthToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10, // 10 minutes
      });

      return {
        success: true,
        requiresTOTP: existingUser.totpEnabled || false,
      };
    }
  );
}

async function verifyTOTPForMerge(rawToken, isBackupCode = false) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new AuthRateLimiter({ redisAdapter });
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  // Verify merge auth token
  const mergeAuthToken = (await cookies()).get('mergeAuthenticatedToken');
  if (!mergeAuthToken) {
    console.log('Missing merge auth token for TOTP');
    return { success: false, error: 'Authentication required' };
  }

  let authTokenData;
  try {
    authTokenData = jwt.verify(mergeAuthToken.value, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    console.log('Invalid merge auth token for TOTP');
    return { success: false, error: 'Authentication expired' };
  }

  if (authTokenData.type !== 'mergeAuthenticated') {
    console.log('Invalid auth token type for merge TOTP');
    return { success: false, error: 'Authentication expired' };
  }

  return await rateLimiter.withRateLimit(
    { ip, processId: 'verifyTOTPForMerge', userId: authTokenData.userId },
    async () => {
      const validation = validateAndSanitize(
        rawToken,
        isBackupCode ? backupCodeSchema : totpSchema
      );
      const token = validation.data;

      if (!validation.success) {
        console.log('TOTP validation error for merge');
        return { success: false, error: 'Invalid verification code format' };
      }

      const userRepository = new UserRepository({ redisAdapter });
      const user = await userRepository.get({ userId: authTokenData.userId });

      if (!user) {
        console.log('User not found during merge TOTP verification');
        return { success: false, error: 'User not found' };
      }

      if (!isBackupCode && !user.totpSecret) {
        console.log('TOTP not set up for user during merge');
        return {
          success: false,
          error: 'Two-factor authentication not configured',
        };
      }

      let isValid = false;

      if (isBackupCode) {
        if (!user.backupCodes || !Array.isArray(user.backupCodes)) {
          console.log('No backup codes available for user during merge');
          return { success: false, error: 'No backup codes available' };
        }

        const codeIndex = await verifyBackupCode(token, user.backupCodes);
        if (codeIndex >= 0) {
          user.backupCodes[codeIndex].used = true;
          await userRepository.set({ userId: user.id, user });
          isValid = true;
        }
      } else {
        // Verify TOTP code
        isValid = speakeasy.totp.verify({
          secret: user.totpSecret,
          encoding: 'base32',
          token: token,
          window: 2,
        });
      }

      if (!isValid) {
        console.log('Invalid TOTP verification code during merge');
        return { success: false, error: 'Invalid verification code' };
      }

      // Update auth token to indicate TOTP is verified
      const fullyAuthenticatedToken = jwt.sign(
        {
          type: 'mergeFullyAuthenticated',
          userId: authTokenData.userId,
          tenantId: authTokenData.tenantId,
          mergeTokenId: authTokenData.mergeTokenId,
        },
        process.env.JWT_SECRET,
        { expiresIn: '10m', algorithm: 'HS256' }
      );

      (await cookies()).set(
        'mergeAuthenticatedToken',
        fullyAuthenticatedToken,
        {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 10, // 10 minutes
        }
      );

      return { success: true };
    }
  );
}

async function confirmAccountMerge() {
  const redisAdapter = new RedisAdapter({ redisClient });

  try {
    // Verify both tokens are present and valid
    const googleMergeToken = (await cookies()).get('googleAccountMergeToken');
    const authToken = (await cookies()).get('mergeAuthenticatedToken');

    if (!googleMergeToken || !authToken) {
      console.log('Missing required tokens for account merge');
      return { success: false, error: 'Authentication required' };
    }

    let googleTokenData, authTokenData;
    try {
      googleTokenData = jwt.verify(
        googleMergeToken.value,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] }
      );
      authTokenData = jwt.verify(authToken.value, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
    } catch (error) {
      console.log('Invalid tokens during account merge confirmation');
      return { success: false, error: 'Authentication expired' };
    }

    // Verify token types and consistency
    if (
      googleTokenData.type !== 'googleAccountMerge' ||
      !['mergeAuthenticated', 'mergeFullyAuthenticated'].includes(
        authTokenData.type
      )
    ) {
      console.log('Invalid token types during merge confirmation');
      return { success: false, error: 'Authentication expired' };
    }

    // Verify user IDs match
    if (googleTokenData.existingUserId !== authTokenData.userId) {
      console.log('User ID mismatch during merge confirmation');
      return { success: false, error: 'Authentication mismatch' };
    }

    // Perform the actual account merge
    const userRepository = new UserRepository({ redisAdapter });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });

    // Get the user to be updated
    const user = await userRepository.get({ userId: authTokenData.userId });
    if (!user) {
      console.log('User not found during merge confirmation');
      return { success: false, error: 'User not found' };
    }

    // Security check: If user has 2FA enabled, they must have completed TOTP verification
    if (user.totpEnabled && authTokenData.type !== 'mergeFullyAuthenticated') {
      console.log(
        'User has 2FA enabled but did not complete TOTP verification'
      );
      return { success: false, error: 'Two-factor authentication required' };
    }

    // Invalidate ALL existing sessions for this user before merge
    const userSessions = await sessionRepository.getUserSessions(user.id);
    for (const userSession of userSessions) {
      await sessionRepository.delete({ sessionId: userSession.sessionId });
    }

    // Convert account to Google-only authentication
    user.authProvider = 'google';
    user.password = null; // Remove password
    user.totpEnabled = false; // Disable 2FA
    user.totpSecret = null; // Remove TOTP secret
    user.backupCodes = null; // Remove backup codes

    // Update user name if provided by Google
    if (googleTokenData.googleUserData.name) {
      user.name = googleTokenData.googleUserData.name;
    }

    // Save the updated user
    await userRepository.set({ userId: user.id, user });

    // Create new session with Google authentication
    const session = await sessionManager.createSession({
      userId: user.id,
      tenantId: user.tenantId,
      userRole: user.role,
      cookies: await cookies(),
    });

    const sessionToken = jwt.sign(
      { sessionId: session.sessionId, type: 'session' },
      process.env.JWT_SECRET,
      { expiresIn: '3h', algorithm: 'HS256' }
    );

    // Set new session cookie
    (await cookies()).set('session-id', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 3, // 3 hours
    });

    // Clear merge-related cookies
    (await cookies()).set('googleAccountMergeToken', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    (await cookies()).set('mergeAuthenticatedToken', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    console.log(
      `Successfully merged account for user ${user.id} with Google authentication`
    );
  } catch (error) {
    console.error('Unexpected error during account merge:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }

  // Redirect after successful merge (outside try-catch)
  redirect('/app');
}

export { authenticateForMerge, verifyTOTPForMerge, confirmAccountMerge };
