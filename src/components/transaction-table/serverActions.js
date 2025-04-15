'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { EditTransactionService } from '@/backend/services/editTransactionService';
import { DeleteTransactionService } from '@/backend/services/deleteTransactionService';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Schema for validating transaction data
const transactionSchema = z.object({
  planId: z.string(),
  transactionId: z.string(),
  categoryId: z.string().nullable(),
  subcategoryId: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  description: z.string().min(1).max(500),
  status: z.string().max(100),
  type: z.string().max(100),
  amount: z.number().min(0),
  newCategoryId: z.string().nullable(),
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

const editTransaction = async ({
  planId,
  transactionId,
  categoryId,
  subcategoryId,
  date,
  description,
  status,
  type,
  amount,
  newCategoryId,
}) => {
  try {
    // Sanitize text inputs
    const sanitizedDescription = sanitizeText(description);
    const sanitizedStatus = sanitizeText(status);
    const sanitizedType = sanitizeText(type);
    const sanitizedPlanId = sanitizeText(planId);
    const sanitizedTransactionId = sanitizeText(transactionId);
    const sanitizedCategoryId = sanitizeText(categoryId);
    const sanitizedSubcategoryId = sanitizeText(subcategoryId);
    const sanitizedDate = sanitizeText(date);
    const sanitizedNewCategoryId = sanitizeText(newCategoryId);

    // Validate the input data
    const validationResult = transactionSchema.safeParse({
      planId: sanitizedPlanId,
      transactionId: sanitizedTransactionId,
      categoryId: sanitizedCategoryId,
      subcategoryId: sanitizedSubcategoryId,
      date: sanitizedDate,
      description: sanitizedDescription,
      status: sanitizedStatus,
      type: sanitizedType,
      amount,
      newCategoryId: sanitizedNewCategoryId,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      console.log('Transaction edit failed: Invalid input data');
      return false;
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
      console.log('Transaction edit failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log(
        'Transaction edit failed: Insufficient permissions - viewer role'
      );
      return false;
    }
    const tenantId = session.tenantId;

    const transactionManager = new TransactionManager();
    const service = new EditTransactionService({
      transactionManager,
    });
    await service.execute({
      tenantId,
      planId: validData.planId,
      transactionId: validData.transactionId,
      categoryId: validData.categoryId,
      subcategoryId: validData.subcategoryId,
      date: validData.date,
      description: validData.description,
      status: validData.status,
      type: validData.type,
      amount: validData.amount,
      newCategoryId: validData.newCategoryId,
    });
    return true;
  } catch (error) {
    console.error(error);
    console.log('Transaction edit failed: Unexpected error occurred');
    return false;
  }
};

const deleteTransaction = async ({ planId, transactionId }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Transaction delete failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log(
        'Transaction delete failed: Insufficient permissions - viewer role'
      );
      return false;
    }
    const tenantId = session.tenantId;

    const transactionManager = new TransactionManager();
    const service = new DeleteTransactionService({
      transactionManager,
    });
    await service.execute({
      tenantId,
      planId,
      transactionId,
    });
    return true;
  } catch (error) {
    console.error(error);
    console.log('Transaction delete failed: Unexpected error occurred');
    return false;
  }
};

export { editTransaction, deleteTransaction };
