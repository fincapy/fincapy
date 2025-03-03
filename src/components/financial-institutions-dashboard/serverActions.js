'use server';
import { PlaidAdapter, client } from '@/backend/adapters/plaid';
import { CreatePlaidItemService } from '@/backend/services/createPlaidItemService';
import { UpdatePlaidItemService } from '@/backend/services/updatePlaidItemService';
import { DeletePlaidItemService } from '@/backend/services/deletePlaidItemService';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { cookies } from 'next/headers';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Sanitization function for strings
const sanitizeString = (input) => {
  if (!input) return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
};

// Validation schemas
const LinkTokenSchema = z.object({
  institutionId: z.string().trim().min(1)
});

const CreatePlaidItemSchema = z.object({
  publicToken: z.string().trim().min(1),
  plaidItemId: z.string().trim().min(1),
  institutionId: z.string().trim().min(1),
  institutionName: z.string().trim().min(1)
});

const UpdatePlaidItemSchema = z.object({
  plaidItemId: z.string().trim().min(1),
  publicToken: z.string().trim().min(1)
});

const DeletePlaidItemSchema = z.object({
  plaidItemId: z.string().trim().min(1)
});

const fetchLinkToken = async (params) => {
  try {
    // Validate inputs
    const validationResult = LinkTokenSchema.safeParse(params);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return { error: 'Invalid input parameters' };
    }

    // Sanitize inputs
    const { institutionId } = validationResult.data;
    const sanitizedInstitutionId = sanitizeString(institutionId);

    // Proceed with business logic
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      return { error: 'Unauthorized' };
    }
    if (session.userRole === 'viewer') {
      return { error: 'Insufficient permissions' };
    }
    
    const tenantId = session.tenantId;
    const tenantRepository = new TenantRepository({ redisAdapter });
    const tenant = await tenantRepository.get({ tenantId });
    const plaidItem = tenant.plaidItems.find(
      (item) => item.institutionId === sanitizedInstitutionId
    );
    const plaidAdapter = new PlaidAdapter(client);
    const linkToken = await plaidAdapter.createLinkToken({
      tenantId: tenantId,
      existingAccessToken: plaidItem?.accessToken,
    });
    return { data: linkToken };
  } catch (error) {
    console.error('Error in fetchLinkToken:', error);
    return { error: 'Failed to fetch link token' };
  }
};

const createPlaidItem = async (params) => {
  try {
    // Validate inputs
    const validationResult = CreatePlaidItemSchema.safeParse(params);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return { error: 'Invalid input parameters' };
    }

    // Sanitize inputs
    const {
      publicToken,
      plaidItemId,
      institutionId,
      institutionName,
    } = validationResult.data;
    
    const sanitizedParams = {
      publicToken: sanitizeString(publicToken),
      plaidItemId: sanitizeString(plaidItemId),
      institutionId: sanitizeString(institutionId),
      institutionName: sanitizeString(institutionName),
    };

    // Proceed with business logic
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      return { error: 'Unauthorized' };
    }
    if (session.userRole === 'viewer') {
      return { error: 'Insufficient permissions' };
    }
    
    const tenantId = session.tenantId;
    const userId = session.userId;
    const plaidAdapter = new PlaidAdapter(client);
    const transactionManager = new TransactionManager();
    const service = new CreatePlaidItemService({
      transactionManager,
      plaidAdapter,
    });

    await service.execute({
      userId,
      plaidItemId: sanitizedParams.plaidItemId,
      tenantId,
      institutionId: sanitizedParams.institutionId,
      institutionName: sanitizedParams.institutionName,
      publicToken: sanitizedParams.publicToken,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in createPlaidItem:', error);
    return { error: 'Failed to create Plaid item' };
  }
};

const updatePlaidItem = async (params) => {
  try {
    // Validate inputs
    const validationResult = UpdatePlaidItemSchema.safeParse(params);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return { error: 'Invalid input parameters' };
    }

    // Sanitize inputs
    const { plaidItemId, publicToken } = validationResult.data;
    const sanitizedPlaidItemId = sanitizeString(plaidItemId);
    const sanitizedPublicToken = sanitizeString(publicToken);

    // Proceed with business logic
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      return { error: 'Unauthorized' };
    }
    if (session.userRole === 'viewer') {
      return { error: 'Insufficient permissions' };
    }
    
    const tenantId = session.tenantId;
    const transactionManager = new TransactionManager();
    const plaidAdapter = new PlaidAdapter(client);
    const service = new UpdatePlaidItemService({
      transactionManager,
      plaidAdapter,
    });
    
    await service.execute({
      tenantId,
      plaidItemId: sanitizedPlaidItemId,
      publicToken: sanitizedPublicToken,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in updatePlaidItem:', error);
    return { error: 'Failed to update Plaid item' };
  }
};

const deletePlaidItem = async (params) => {
  try {
    // Validate inputs
    const validationResult = DeletePlaidItemSchema.safeParse(params);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return { error: 'Invalid input parameters' };
    }

    // Sanitize inputs
    const { plaidItemId } = validationResult.data;
    const sanitizedPlaidItemId = sanitizeString(plaidItemId);

    // Proceed with business logic
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      return { error: 'Unauthorized' };
    }
    if (session.userRole === 'viewer') {
      return { error: 'Insufficient permissions' };
    }
    
    const tenantId = session.tenantId;
    const plaidAdapter = new PlaidAdapter(client);
    const transactionManager = new TransactionManager();
    const service = new DeletePlaidItemService({
      transactionManager,
      plaidAdapter,
    });
    
    await service.execute({ 
      tenantId, 
      plaidItemId: sanitizedPlaidItemId 
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error in deletePlaidItem:', error);
    return { error: 'Failed to delete Plaid item' };
  }
};

export { fetchLinkToken, createPlaidItem, updatePlaidItem, deletePlaidItem };
