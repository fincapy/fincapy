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
function hashEmail(email) {
  return crypto
    .createHash('sha256')
    .update(email.trim().toLowerCase())
    .digest('hex');
}

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(ip.trim().toLowerCase())
    .digest('hex');
}

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

async function authenticateForHighRiskAction(rawInput) {
  const redisAdapter = new RedisAdapter({ redisClient });
  const rateLimiter = new AuthRateLimiter({ redisAdapter });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });

  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('fly-client-ip') || 'unknown-ip';

  // Verify user has an active session
  const cookiesList = await cookies();
  const session = await sessionManager.touchSession({
    cookies: cookiesList,
  });
  if (!session) {
    return redirect('/signin');
  }

  return await rateLimiter.withRateLimit(
    { ip, processId: 'authenticateForHighRiskAction', userId: rawInput.email },
    async () => {
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
        console.log('Email/password validation failed');
        return false;
      }

      const userRepository = new UserRepository({ redisAdapter });
      const authenticator = new EmailPasswordAuthenticator({
        userRepository,
      });
      const user = await userRepository.getByEmail({ email });

      // Verify the user email matches the session user
      if (!user || user.id !== session.userId) {
        console.log('Email does not match authenticated user');
        return false;
      }

      const result = await authenticator.authenticate({
        unauthenticatedPassword: password,
        password: user?.password,
      });

      if (result) {
        const emailPasswordAuthenticatedHighRiskActionToken = jwt.sign(
          {
            userId: user.id,
            tenantId: user.tenantId,
            type: 'emailPasswordAuthenticatedHighRiskAction',
          },
          process.env.JWT_SECRET,
          { expiresIn: '5m', algorithm: 'HS256' }
        );

        (await cookies()).set(
          'emailPasswordAuthenticatedHighRiskActionToken',
          emailPasswordAuthenticatedHighRiskActionToken,
          {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 5, // 5 minutes
          }
        );

        return true;
      }

      console.log('Invalid email/password combination');
      return false;
    }
  );
}

export { authenticateForHighRiskAction };
