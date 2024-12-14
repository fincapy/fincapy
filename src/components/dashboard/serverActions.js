'use server';

import { db } from '@/backend/adapters/database';
import { CategoryRepository } from '@/backend/adapters/repositories/categoryRepository';
import { SubcategoryRepository } from '@/backend/adapters/repositories/subcategoryRepository';
import { CreateCategoryService } from '@/backend/services/createCategoryService';
import { CreateSubcategoryService } from '@/backend/services/createSubcategoryService';
import { UpdateCategoryService } from '@/backend/services/updateCategoryService';
import { DeleteCategoryService } from '@/backend/services/deleteCategoryService';
import { UpdateSubcategoryService } from '@/backend/services/updateSubcategoryService';
import { DeleteSubcategoryService } from '@/backend/services/deleteSubcategoryService';
import { getSession } from '@auth0/nextjs-auth0';

const createCategory = async ({ categoryId, name, monthlySpendingGoal }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;

  const service = new CreateCategoryService({
    categoryRepositoryFactory: CategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    categoryId,
    name,
    monthlySpendGoal: monthlySpendingGoal,
    yearlySpendGoal: monthlySpendingGoal * 12,
  });
};

const updateCategory = async ({ categoryId, name, monthlySpendGoal }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new UpdateCategoryService({
    categoryRepositoryFactory: CategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    categoryId,
    name,
    monthlySpendGoal,
  });
};

const deleteCategory = async ({ categoryId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new DeleteCategoryService({
    categoryRepositoryFactory: CategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    categoryId,
  });
};

const createSubcategory = async ({
  subcategoryId,
  categoryId,
  name,
  monthlySpendGoal,
  yearlySpendGoal,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new CreateSubcategoryService({
    subcategoryRepositoryFactory: SubcategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
  });
};

const updateSubcategory = async ({
  subcategoryId,
  categoryId,
  name,
  monthlySpendGoal,
  yearlySpendGoal,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new UpdateSubcategoryService({
    subcategoryRepositoryFactory: SubcategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
  });
};

const deleteSubcategory = async ({ subcategoryId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new DeleteSubcategoryService({
    subcategoryRepositoryFactory: SubcategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    subcategoryId,
  });
};

export {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
};
