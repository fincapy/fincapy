'use server';

import { RedisAdapter, redisClient } from '@/backend/adapters/redisAdapter';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
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

const createCategory = async ({
  categoryId,
  name,
  monthlyGoal,
  planId,
  type,
}) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }

    const tenantId = session.tenantId;
    const service = new CreateCategoryService({
      tenantRepository: new TenantRepository({ redisAdapter }),
    });

    await service.execute({
      tenantId,
      categoryId,
      name,
      monthlyGoal: monthlyGoal,
      type,
      isImmutable: false,
      planId,
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

const updateCategory = async ({ categoryId, name, monthlyGoal, planId }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }
    const tenantId = session.tenantId;

    const service = new UpdateCategoryService({
      tenantRepository: new TenantRepository({ redisAdapter }),
    });

    await service.execute({
      tenantId,
      categoryId,
      name,
      monthlyGoal,
      planId,
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

const deleteCategory = async ({ categoryId, planId }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }
    const tenantId = session.tenantId;

    const service = new DeleteCategoryService({
      tenantRepository: new TenantRepository({ redisAdapter }),
    });

    await service.execute({
      tenantId,
      categoryId,
      planId,
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

const createSubcategory = async ({ categoryId, name, monthlyGoal, planId }) => {
  try {
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }
    const tenantId = session.tenantId;

    const service = new CreateSubcategoryService({
      tenantRepository: new TenantRepository({ redisAdapter }),
    });

    await service.execute({
      tenantId,
      categoryId,
      name,
      monthlyGoal,
      isImmutable: false,
      planId,
    });
  } catch (error) {
    console.error(error);
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
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }
    const tenantId = session.tenantId;

    const service = new UpdateSubcategoryService({
      tenantRepository: new TenantRepository({ redisAdapter }),
    });

    await service.execute({
      tenantId,
      subcategoryId,
      categoryId,
      name,
      monthlyGoal,
      planId,
    });
  } catch (error) {
    console.error(error);
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
    const redisAdapter = new RedisAdapter({ redisClient });
    const sessionRepository = new SessionRepository({ redisAdapter });
    const sessionManager = new SessionManager({ sessionRepository });
    const session = await sessionManager.touchSession({ cookies: cookies() });
    if (!session) {
      return false;
    }
    const tenantId = session.tenantId;

    const service = new DeleteSubcategoryService({
      tenantRepository: new TenantRepository({ redisAdapter }),
    });

    await service.execute({
      tenantId,
      subcategoryId,
      categoryId,
      planId,
      type,
    });
  } catch (error) {
    console.error(error);
    return false;
  }
  return true;
};

const reorderCategories = async ({ planId, type, oldIndex, newIndex }) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({ cookies: cookies() });
  if (!session) {
    return false;
  }
  const tenantId = session.tenantId;

  const service = new ReorderCategoriesService({
    tenantRepository: new TenantRepository({ redisAdapter }),
  });

  await service.execute({
    tenantId,
    planId,
    type,
    oldIndex,
    newIndex,
  });
};

const reorderSubcategories = async ({
  planId,
  categoryId,
  oldIndex,
  newIndex,
}) => {
  const redisAdapter = new RedisAdapter({ redisClient });
  const sessionRepository = new SessionRepository({ redisAdapter });
  const sessionManager = new SessionManager({ sessionRepository });
  const session = await sessionManager.touchSession({ cookies: cookies() });
  if (!session) {
    return false;
  }
  const tenantId = session.tenantId;

  const service = new ReorderSubcategoriesService({
    tenantRepository: new TenantRepository({ redisAdapter }),
  });

  await service.execute({
    tenantId,
    planId,
    categoryId,
    oldIndex,
    newIndex,
  });
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
