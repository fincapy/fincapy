'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { RemoveUserService } from '@/backend/services/removeUserService';
import { ChangeUserRoleService } from '@/backend/services/changeUserRoleService';
import { ChangeUserNameService } from '@/backend/services/changeUserNameService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { Auth0Adapter, auth0Client } from '@/backend/adapters/auth0';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Schema for user ID validation
const userIdSchema = z.object({
  userId: z.string().uuid(),
});

// Schema for role change validation
const roleChangeSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['owner', 'editor', 'viewer']),
});

// Schema for name change validation
const nameChangeSchema = z.object({
  userId: z.string().uuid(),
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

const removeUser = async ({ userId }) => {
  try {
    // Sanitize input
    const sanitizedUserId = sanitizeText(userId);

    // Validate input
    const validationResult = userIdSchema.safeParse({
      userId: sanitizedUserId,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      console.log('Role changed validation failed');
      return false;
    }

    // Use validated data
    const validData = validationResult.data;

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });

    if (!session) {
      console.log('Remove user failed: No valid session found');
      return { success: false, error: 'Authentication required' };
    }

    if (session.userRole !== 'owner') {
      console.log('Remove user failed: User does not have owner permissions');
      return { success: false, error: 'Insufficient permissions' };
    }

    const tenantId = session.tenantId;

    const transactionManager = new TransactionManager();
    const auth0Adapter = new Auth0Adapter({ client: auth0Client });
    const removeUserService = new RemoveUserService({
      transactionManager,
      auth0Adapter,
    });

    await removeUserService.execute({
      tenantId,
      userId: validData.userId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing user:', error);
    return { success: false, error: 'Server error' };
  }
};

const changeUserRole = async ({ userId, role }) => {
  try {
    // Sanitize inputs
    const sanitizedUserId = sanitizeText(userId);
    const sanitizedRole = sanitizeText(role);

    // Validate inputs
    const validationResult = roleChangeSchema.safeParse({
      userId: sanitizedUserId,
      role: sanitizedRole,
    });

    if (!validationResult.success) {
      console.log('Role change validation failed');
      return false;
    }

    // Use validated data
    const validData = validationResult.data;

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });

    if (!session) {
      console.log('Change role failed: No valid session found');
      return { success: false, error: 'Authentication required' };
    }

    if (session.userRole !== 'owner') {
      console.log('Change role failed: User does not have owner permissions');
      return { success: false, error: 'Insufficient permissions' };
    }

    const tenantId = session.tenantId;
    const transactionManager = new TransactionManager();
    const changeUserRoleService = new ChangeUserRoleService({
      transactionManager,
    });

    await changeUserRoleService.execute({
      tenantId,
      userId: validData.userId,
      role: validData.role,
    });

    return { success: true };
  } catch (error) {
    console.error('Error changing user role:', error);
    return { success: false, error: 'Server error' };
  }
};

const changeUserName = async ({ userId, name }) => {
  try {
    // Sanitize inputs
    const sanitizedUserId = sanitizeText(userId);
    const sanitizedName = sanitizeText(name);

    // Validate inputs
    const validationResult = nameChangeSchema.safeParse({
      userId: sanitizedUserId,
      name: sanitizedName,
    });

    if (!validationResult.success) {
      console.log('Name change validation failed');
      return false;
    }

    // Use validated data
    const validData = validationResult.data;

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });

    if (!session) {
      console.log('Change name failed: No valid session found');
      return { success: false, error: 'Authentication required' };
    }

    if (session.userRole !== 'owner') {
      console.log('Change name failed: User does not have owner permissions');
      return { success: false, error: 'Insufficient permissions' };
    }

    const tenantId = session.tenantId;
    const transactionManager = new TransactionManager();
    const changeUserNameService = new ChangeUserNameService({
      transactionManager,
    });

    await changeUserNameService.execute({
      tenantId,
      userId: validData.userId,
      name: validData.name,
    });

    return { success: true };
  } catch (error) {
    console.error('Error changing user name:', error);
    return { success: false, error: 'Server error' };
  }
};

export { removeUser, changeUserRole, changeUserName };
