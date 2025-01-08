'use server';

import { TigrisAdapter, s3client } from '@/backend/adapters/tigris';
import { TenantRepository } from '@/backend/adapters/repositories/TenantRepository';
import { CreateCategoryService } from '@/backend/services/createCategoryService';
import { CreateSubcategoryService } from '@/backend/services/createSubcategoryService';
import { UpdateCategoryService } from '@/backend/services/updateCategoryService';
import { DeleteCategoryService } from '@/backend/services/deleteCategoryService';
import { UpdateSubcategoryService } from '@/backend/services/updateSubcategoryService';
import { DeleteSubcategoryService } from '@/backend/services/deleteSubcategoryService';
import { ReorderSpendingCategoriesService } from '@/backend/services/reorderSpendingCategoriesService';
import { ReorderSpendingSubcategoriesService } from '@/backend/services/reorderSpendingSubcategoriesService';
import { getSession } from '@auth0/nextjs-auth0';

const createCategory = async ({ categoryId, name, monthlyGoal, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new CreateCategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    categoryId,
    name,
    monthlyGoal: monthlyGoal,
    type: 'spending',
    isImmutable: false,
    planId,
  });
};

const updateCategory = async ({ categoryId, name, monthlyGoal, planId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new UpdateCategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
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

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new DeleteCategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
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

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new CreateSubcategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
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

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new UpdateSubcategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
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

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new DeleteSubcategoryService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    subcategoryId,
    planId,
  });
};

const reorderSpendingCategories = async ({ planId, oldIndex, newIndex }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new ReorderSpendingCategoriesService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
  });

  await service.execute({
    tenantId,
    planId,
    oldIndex,
    newIndex,
  });
};

const reorderSpendingSubcategories = async ({
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

  const tigrisAdapter = new TigrisAdapter({ client: s3client });
  const service = new ReorderSpendingSubcategoriesService({
    tenantRepository: new TenantRepository({ tigrisAdapter }),
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
  reorderSpendingCategories,
  reorderSpendingSubcategories,
};
