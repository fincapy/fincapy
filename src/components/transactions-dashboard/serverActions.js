'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { CreateTransactionService } from '@/backend/services/createTransactionService';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { redirect } from 'next/navigation';

// Schema for validating transaction data
const transactionSchema = z.object({
  planId: z.string(),
  categoryId: z.string().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  description: z.string().min(1).max(500),
  status: z.string().max(100),
  type: z.string().max(100),
  amount: z.number().min(0),
  transactionId: z.string().optional(),
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

const createTransaction = async ({
  planId,
  categoryId,
  date,
  description,
  status,
  type,
  amount,
  transactionId,
}) => {
  try {
    // Sanitize text inputs
    const sanitizedPlanId = sanitizeText(planId);
    const sanitizedCategoryId = sanitizeText(categoryId);
    const sanitizedDate = sanitizeText(date);
    const sanitizedDescription = sanitizeText(description);
    const sanitizedStatus = sanitizeText(status);
    const sanitizedType = sanitizeText(type);
    const sanitizedTransactionId = sanitizeText(transactionId);

    // Validate the input data
    const validationResult = transactionSchema.safeParse({
      planId: sanitizedPlanId,
      categoryId: sanitizedCategoryId,
      date: sanitizedDate,
      description: sanitizedDescription,
      status: sanitizedStatus,
      type: sanitizedType,
      amount,
      transactionId: sanitizedTransactionId,
    });

    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      console.log('Transaction creation failed: Invalid input data');
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
      console.log('Transaction creation failed: No valid session found');
      return redirect('/signin');
    }

    if (session.userRole === 'viewer') {
      console.log(
        'Transaction creation failed: Insufficient permissions - viewer role'
      );
      return false;
    }

    const transactionManager = new TransactionManager();
    const createTransactionService = new CreateTransactionService({
      transactionManager,
    });
    const tenantId = session.tenantId;

    await createTransactionService.execute({
      tenantId,
      planId: validData.planId,
      categoryId: validData.categoryId,
      date: validData.date,
      description: validData.description,
      status: validData.status,
      type: validData.type,
      amount: validData.amount,
      transactionId: validData.transactionId,
    });

    return true;
  } catch (error) {
    console.error('Error creating transaction:', error);
    console.log('Transaction creation failed: Unexpected error occurred');
    return false;
  }
};

export { createTransaction };
