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
import { redirect } from 'next/navigation';

// Sanitization function for strings
const sanitizeString = (input) => {
  if (!input) return input;
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
};

// Validation schemas
const LinkTokenSchema = z.object({
  institutionId: z.string().min(1).optional().nullable(),
});

const CreatePlaidItemSchema = z.object({
  publicToken: z.string().trim().min(1),
  plaidItemId: z.string().trim().min(1),
  institutionId: z.string().trim().min(1),
  institutionName: z.string().trim().min(1),
});

const UpdatePlaidItemSchema = z.object({
  plaidItemId: z.string().trim().min(1),
  publicToken: z.string().trim().min(1),
});

const DeletePlaidItemSchema = z.object({
  plaidItemId: z.string().trim().min(1),
});

const fetchLinkToken = async ({ institutionId }) => {
  try {
    // Validate inputs
    const validationResult = LinkTokenSchema.safeParse({ institutionId });
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return false;
    }

    // Proceed with business logic
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });

    if (!session) {
      console.log('fetchLinkToken: No valid session found');
      return redirect('/signin');
    }
    if (session.userRole === 'viewer') {
      console.log('fetchLinkToken: User role viewer is not authorized');
      return false;
    }

    const tenantId = session.tenantId;
    const tenantRepository = new TenantRepository({ redisAdapter });
    const tenant = await tenantRepository.get({ tenantId });
    const plaidItem = tenant.plaidItems.find(
      (item) => item.institutionId === institutionId
    );
    const plaidAdapter = new PlaidAdapter(client);
    const linkToken = await plaidAdapter.createLinkToken({
      tenantId: tenantId,
      existingAccessToken: plaidItem?.accessToken,
    });
    return linkToken;
  } catch (error) {
    console.error('Error in fetchLinkToken:');
    return false;
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
    const { publicToken, plaidItemId, institutionId, institutionName } =
      validationResult.data;

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
      console.log('createPlaidItem: No valid session found');
      return redirect('/signin');
    }
    if (session.userRole === 'viewer') {
      console.log('createPlaidItem: User role viewer is not authorized');
      return false;
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

    return true;
  } catch (error) {
    console.error('Error in createPlaidItem:');
    return false;
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
      console.log('updatePlaidItem: No valid session found');
      return redirect('/signin');
    }
    if (session.userRole === 'viewer') {
      console.log('updatePlaidItem: User role viewer is not authorized');
      return false;
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

    return true;
  } catch (error) {
    console.error('Error in updatePlaidItem:');
    return false;
  }
};

const deletePlaidItem = async (params) => {
  try {
    // Validate inputs
    const validationResult = DeletePlaidItemSchema.safeParse(params);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error);
      return false;
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
      console.log('deletePlaidItem: No valid session found');
      return redirect('/signin');
    }
    if (session.userRole === 'viewer') {
      console.log('deletePlaidItem: User role viewer is not authorized');
      return false;
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
      plaidItemId: sanitizedPlaidItemId,
    });

    return true;
  } catch (error) {
    console.error('Error in deletePlaidItem:');
    return false;
  }
};

export { fetchLinkToken, createPlaidItem, updatePlaidItem, deletePlaidItem };
