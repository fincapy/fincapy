'use server';

import { db } from '@/backend/adapters/database';
import { SpendingCategoryRepository } from '@/backend/adapters/repositories/spendingCategoryRepository';
import { SpendingSubcategoryRepository } from '@/backend/adapters/repositories/spendingSubcategoryRepository';
import { CreateSpendingCategoryService } from '@/backend/services/createSpendingCategoryService';
import { CreateSpendingSubcategoryService } from '@/backend/services/createSpendingSubcategoryService';
import { UpdateSpendingCategoryService } from '@/backend/services/spendingUpdateCategoryService';
import { DeleteSpendingCategoryService } from '@/backend/services/deleteSpendingCategoryService';
import { UpdateSpendingSubcategoryService } from '@/backend/services/updateSubcategoryService';
import { DeleteSpendingSubcategoryService } from '@/backend/services/deleteSubcategoryService';
import { getSession } from '@auth0/nextjs-auth0';

const createSpendingCategory = async ({
  spendingCategoryId,
  name,
  monthlySpendingGoal,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }

  const tenantId = session.user.tenant_id;

  const service = new CreateSpendingCategoryService({
    spendingCategoryRepositoryFactory: SpendingCategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    spendingCategoryId,
    name,
    monthlySpendGoal: monthlySpendingGoal,
    yearlySpendGoal: monthlySpendingGoal * 12,
  });
};

const updateSpendingCategory = async ({
  spendingCategoryId,
  name,
  monthlySpendGoal,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new UpdateSpendingCategoryService({
    spendingCategoryRepositoryFactory: SpendingCategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    spendingCategoryId,
    name,
    monthlySpendGoal,
  });
};

const deleteSpendingCategory = async ({ spendingCategoryId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new DeleteSpendingCategoryService({
    spendingCategoryRepositoryFactory: SpendingCategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    spendingCategoryId,
  });
};

const createSpendingSubcategory = async ({
  spendingSubcategoryId,
  spendingCategoryId,
  name,
  monthlySpendGoal,
  yearlySpendGoal,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new CreateSpendingSubcategoryService({
    spendingSubcategoryRepositoryFactory: SpendingSubcategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    spendingSubcategoryId,
    spendingCategoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
  });
};

const updateSpendingSubcategory = async ({
  spendingSubcategoryId,
  spendingCategoryId,
  name,
  monthlySpendGoal,
  yearlySpendGoal,
}) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new UpdateSpendingSubcategoryService({
    spendingSubcategoryRepositoryFactory: SpendingSubcategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    spendingSubcategoryId,
    spendingCategoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
  });
};

const deleteSpendingSubcategory = async ({ spendingSubcategoryId }) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new DeleteSpendingSubcategoryService({
    spendingSubcategoryRepositoryFactory: SpendingSubcategoryRepository,
    db,
  });

  await service.execute({
    tenantId,
    spendingSubcategoryId,
  });
};

export {
  createSpendingCategory,
  updateSpendingCategory,
  deleteSpendingCategory,
  createSpendingSubcategory,
  updateSpendingSubcategory,
  deleteSpendingSubcategory,
};
