'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { TransactionManager } from '@/backend/adapters/transactionManager';
import { CreateCategoryService } from '@/backend/services/createCategoryService';
import { CreateSubcategoryService } from '@/backend/services/createSubcategoryService';
import { UpdateCategoryService } from '@/backend/services/updateCategoryService';
import { DeleteCategoryService } from '@/backend/services/deleteCategoryService';
import { UpdateSubcategoryService } from '@/backend/services/updateSubcategoryService';
import { DeleteSubcategoryService } from '@/backend/services/deleteSubcategoryService';
import { ReorderCategoriesService } from '@/backend/services/reorderCategoriesService';
import { ReorderSubcategoriesService } from '@/backend/services/reorderSubcategoriesService';
import { SessionManager } from '@/backend/adapters/auth';
import { SessionRepository } from '@/backend/adapters/repositories/sessionRepository';
import { cookies } from 'next/headers';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';

// Sanitize function to strip HTML
const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {},
    });
  }
  return input;
};

// Validation schemas
const categorySchema = z.object({
  categoryId: z.string().min(1),
  otherSubcategoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  monthlyGoal: z.number().nonnegative(),
  planId: z.string().min(1),
  type: z.string().min(1).max(100),
  color: z.string().min(1).max(100),
});

const updateCategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  monthlyGoal: z.number().nonnegative(),
  planId: z.string().min(1),
  color: z.string().min(1).max(100),
});

const deleteCategorySchema = z.object({
  categoryId: z.string().min(1),
  planId: z.string().min(1),
});

const subcategorySchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  monthlyGoal: z.number().nonnegative(),
  planId: z.string().min(1),
  subcategoryId: z.string().min(1),
});

const updateSubcategorySchema = z.object({
  subcategoryId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  monthlyGoal: z.number().nonnegative(),
  planId: z.string().min(1),
});

const deleteSubcategorySchema = z.object({
  subcategoryId: z.string().min(1),
  categoryId: z.string().min(1),
  planId: z.string().min(1),
  type: z.string().optional(),
});

const reorderCategoriesSchema = z.object({
  planId: z.string().min(1),
  type: z.enum(['income', 'expense', 'savings']),
  oldIndex: z.number().int().nonnegative(),
  newIndex: z.number().int().nonnegative(),
});

const reorderSubcategoriesSchema = z.object({
  planId: z.string().min(1),
  categoryId: z.string().min(1),
  oldIndex: z.number().int().nonnegative(),
  newIndex: z.number().int().nonnegative(),
});

const createCategory = async ({
  categoryId,
  otherSubcategoryId,
  name,
  monthlyGoal,
  planId,
  type,
  color,
}) => {
  try {
    // Validate inputs
    const validatedData = categorySchema.parse({
      categoryId,
      otherSubcategoryId,
      name,
      monthlyGoal,
      planId,
      type,
      color,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      categoryId: sanitizeInput(validatedData.categoryId),
      name: sanitizeInput(validatedData.name),
      planId: sanitizeInput(validatedData.planId),
      type: sanitizeInput(validatedData.type),
      color: sanitizeInput(validatedData.color),
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log('Authorization failed: Viewer role cannot create categories');
      return false;
    }

    const tenantId = session.tenantId;
    const service = new CreateCategoryService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      userId: session.userId,
      otherSubcategoryId: sanitizedData.otherSubcategoryId,
      categoryId: sanitizedData.categoryId,
      name: sanitizedData.name,
      monthlyGoal: sanitizedData.monthlyGoal,
      type: sanitizedData.type,
      isImmutable: false,
      planId: sanitizedData.planId,
      color: sanitizedData.color,
    });
  } catch (error) {
    console.error('Error in createCategory:', error);
    return false;
  }
  return true;
};

const updateCategory = async ({
  categoryId,
  name,
  monthlyGoal,
  planId,
  color,
}) => {
  try {
    // Validate inputs
    const validatedData = updateCategorySchema.parse({
      categoryId,
      name,
      monthlyGoal,
      planId,
      color,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      categoryId: sanitizeInput(validatedData.categoryId),
      name: sanitizeInput(validatedData.name),
      planId: sanitizeInput(validatedData.planId),
      color: sanitizeInput(validatedData.color),
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log('Authorization failed: Viewer role cannot update categories');
      return false;
    }
    const tenantId = session.tenantId;

    const service = new UpdateCategoryService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      userId: session.userId,
      categoryId: sanitizedData.categoryId,
      name: sanitizedData.name,
      monthlyGoal: sanitizedData.monthlyGoal,
      planId: sanitizedData.planId,
      color: sanitizedData.color,
    });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return false;
  }
  return true;
};

const deleteCategory = async ({ categoryId, planId }) => {
  try {
    // Validate inputs
    const validatedData = deleteCategorySchema.parse({
      categoryId,
      planId,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      categoryId: sanitizeInput(validatedData.categoryId),
      planId: sanitizeInput(validatedData.planId),
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log('Authorization failed: Viewer role cannot delete categories');
      return false;
    }
    const tenantId = session.tenantId;

    const service = new DeleteCategoryService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      categoryId: sanitizedData.categoryId,
      planId: sanitizedData.planId,
    });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return false;
  }
  return true;
};

const createSubcategory = async ({
  categoryId,
  name,
  monthlyGoal,
  planId,
  subcategoryId,
}) => {
  try {
    // Validate inputs
    const validatedData = subcategorySchema.parse({
      categoryId,
      name,
      monthlyGoal,
      planId,
      subcategoryId,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      categoryId: sanitizeInput(validatedData.categoryId),
      name: sanitizeInput(validatedData.name),
      planId: sanitizeInput(validatedData.planId),
      subcategoryId: sanitizeInput(validatedData.subcategoryId),
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log(
        'Authorization failed: Viewer role cannot create subcategories'
      );
      return false;
    }
    const tenantId = session.tenantId;

    const service = new CreateSubcategoryService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      categoryId: sanitizedData.categoryId,
      name: sanitizedData.name,
      monthlyGoal: sanitizedData.monthlyGoal,
      isImmutable: false,
      planId: sanitizedData.planId,
      subcategoryId: sanitizedData.subcategoryId,
    });
  } catch (error) {
    console.error('Error in createSubcategory:', error);
    return false;
  }
  return true;
};

const updateSubcategory = async ({
  subcategoryId,
  categoryId,
  name,
  monthlyGoal,
  planId,
}) => {
  try {
    // Validate inputs
    const validatedData = updateSubcategorySchema.parse({
      subcategoryId,
      categoryId,
      name,
      monthlyGoal,
      planId,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      subcategoryId: sanitizeInput(validatedData.subcategoryId),
      categoryId: sanitizeInput(validatedData.categoryId),
      name: sanitizeInput(validatedData.name),
      planId: sanitizeInput(validatedData.planId),
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log(
        'Authorization failed: Viewer role cannot update subcategories'
      );
      return false;
    }
    const tenantId = session.tenantId;

    const service = new UpdateSubcategoryService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      subcategoryId: sanitizedData.subcategoryId,
      categoryId: sanitizedData.categoryId,
      name: sanitizedData.name,
      monthlyGoal: sanitizedData.monthlyGoal,
      planId: sanitizedData.planId,
    });
  } catch (error) {
    console.error('Error in updateSubcategory:', error);
    return false;
  }
  return true;
};

const deleteSubcategory = async ({
  subcategoryId,
  categoryId,
  planId,
  type,
}) => {
  try {
    // Validate inputs
    const validatedData = deleteSubcategorySchema.parse({
      subcategoryId,
      categoryId,
      planId,
      type,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      subcategoryId: sanitizeInput(validatedData.subcategoryId),
      categoryId: sanitizeInput(validatedData.categoryId),
      planId: sanitizeInput(validatedData.planId),
      type: validatedData.type ? sanitizeInput(validatedData.type) : undefined,
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    if (session.userRole === 'viewer') {
      console.log(
        'Authorization failed: Viewer role cannot delete subcategories'
      );
      return false;
    }
    const tenantId = session.tenantId;

    const service = new DeleteSubcategoryService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      subcategoryId: sanitizedData.subcategoryId,
      categoryId: sanitizedData.categoryId,
      planId: sanitizedData.planId,
      type: sanitizedData.type,
    });
  } catch (error) {
    console.error('Error in deleteSubcategory:', error);
    return false;
  }
  return true;
};

const reorderCategories = async ({ planId, type, oldIndex, newIndex }) => {
  try {
    // Validate inputs
    const validatedData = reorderCategoriesSchema.parse({
      planId,
      type,
      oldIndex,
      newIndex,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      planId: sanitizeInput(validatedData.planId),
      type: sanitizeInput(validatedData.type),
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    const tenantId = session.tenantId;

    const service = new ReorderCategoriesService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      planId: sanitizedData.planId,
      type: sanitizedData.type,
      oldIndex: sanitizedData.oldIndex,
      newIndex: sanitizedData.newIndex,
    });

    return true;
  } catch (error) {
    console.error('Error in reorderCategories:', error);
    return false;
  }
};

const reorderSubcategories = async ({
  planId,
  categoryId,
  oldIndex,
  newIndex,
}) => {
  try {
    // Validate inputs
    const validatedData = reorderSubcategoriesSchema.parse({
      planId,
      categoryId,
      oldIndex,
      newIndex,
    });

    // Sanitize string inputs
    const sanitizedData = {
      ...validatedData,
      planId: sanitizeInput(validatedData.planId),
      categoryId: sanitizeInput(validatedData.categoryId),
    };

    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) {
      console.log('Authentication failed: No valid session found');
      return false;
    }
    const tenantId = session.tenantId;

    const service = new ReorderSubcategoriesService({
      transactionManager: new TransactionManager(),
    });

    await service.execute({
      tenantId,
      planId: sanitizedData.planId,
      categoryId: sanitizedData.categoryId,
      oldIndex: sanitizedData.oldIndex,
      newIndex: sanitizedData.newIndex,
    });

    return true;
  } catch (error) {
    console.error('Error in reorderSubcategories:', error);
    return false;
  }
};

export {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderCategories,
  reorderSubcategories,
};

/**
 * Returns whether the current user has completed or skipped onboarding.
 */
export async function getOnboardingStatus() {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) return false;
    const key = `user_prefs:${session.userId}:onboarding`;
    const result = await redisAdapter.get(key);
    const resultString = result.toString();
    return resultString === 'true';
  } catch (error) {
    console.error('Error in getOnboardingStatus:', error);
    return false;
  }
}

/**
 * Sets whether the current user has completed or skipped onboarding.
 * @param {{done: boolean}} params
 */
export async function setOnboardingStatus({ done }) {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({
      cookies: await cookies(),
    });
    if (!session) return false;
    const key = `user_prefs:${session.userId}:onboarding`;
    await redisAdapter.set(key, done ? 'true' : 'false');
    return true;
  } catch (error) {
    console.error('Error in setOnboardingStatus:', error);
    return false;
  }
}
