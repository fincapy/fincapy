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
import { getSession } from '@auth0/nextjs-auth0';

const createCategory = async ({
  categoryId,
  name,
  monthlyGoal,
  planId,
  type,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
  const service = new CreateCategoryService({
    tenantRepository: new TenantRepository({ redisAdapter }),
  });

  try {
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
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
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
};

const deleteCategory = async ({ categoryId, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
  const service = new DeleteCategoryService({
    tenantRepository: new TenantRepository({ redisAdapter }),
  });

  await service.execute({
    tenantId,
    categoryId,
    planId,
  });
};

const createSubcategory = async ({
  subcategoryId,
  categoryId,
  name,
  monthlyGoal,
  planId,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
  const service = new CreateSubcategoryService({
    tenantRepository: new TenantRepository({ redisAdapter }),
  });

  await service.execute({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlyGoal,
    isImmutable: false,
    type: 'spending',
    transactions: [],
    planId,
  });
};

const updateSubcategory = async ({
  subcategoryId,
  categoryId,
  name,
  monthlyGoal,
  planId,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
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
};

const deleteSubcategory = async ({ subcategoryId, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
  const service = new DeleteSubcategoryService({
    tenantRepository: new TenantRepository({ redisAdapter }),
  });

  await service.execute({
    tenantId,
    subcategoryId,
    planId,
  });
};

const reorderCategories = async ({ planId, type, oldIndex, newIndex }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
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
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const redisAdapter = new RedisAdapter({ redisClient });
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
