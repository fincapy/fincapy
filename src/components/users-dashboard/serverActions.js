'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { CreateUserService } from '@/backend/services/createUserService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { redirect } from 'next/navigation';
// Schema for validating user data
const userSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['owner', 'editor', 'viewer']),
  name: z.string().min(1).max(100),
});

// Sanitize function for text inputs
const sanitizeText = (text) => {
  if (!text) return text;
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
};

const inviteUser = async ({ userId, email, role, name }) => {
  try {
    // Sanitize text inputs
    const sanitizedUserId = sanitizeText(userId);
    const sanitizedEmail = sanitizeText(email);
    const sanitizedRole = sanitizeText(role);
    const sanitizedName = sanitizeText(name);

    // Validate the input data
    const validationResult = userSchema.safeParse({
      userId: sanitizedUserId,
      email: sanitizedEmail,
      role: sanitizedRole,
      name: sanitizedName,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      console.log('User invitation failed: Invalid input data');
      return { success: false, error: 'Invalid input data' };
    }

    // Use validated and sanitized data
    const validData = validationResult.data;

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });

    if (!session) {
      console.log('User invitation failed: No valid session found');
      return redirect('/signin');
    }

    if (session.userRole !== 'owner') {
      console.log('User invitation failed: User does not have owner role');
      return { success: false, error: 'Insufficient permissions' };
    }

    const tenantId = session.tenantId;
    const auth0Adapter = new Auth0Adapter({ client: auth0Client });
    const transactionManager = new TransactionManager();
    const createUserService = new CreateUserService({
      transactionManager,
      auth0Adapter,
    });

    await createUserService.execute({
      tenantId,
      userId: validData.userId,
      email: validData.email,
      role: validData.role,
      name: validData.name,
    });

    return { success: true };
  } catch (error) {
    console.error('Error inviting user:', error);
    console.log('User invitation failed: Internal server error');
    return { success: false, error: 'Server error' };
  }
};

export { inviteUser };
