'use server';

import { db } from '@/backend/adapters/database';
import { SpendingCategoryRepository } from '@/backend/adapters/repositories/spendingCategoryRepository';
import { SpendingSubcategoryRepository } from '@/backend/adapters/repositories/spendingSubcategoryRepository';
import { CreateSpendingCategoryService } from '@/backend/services/createSpendingCategoryService';
import { CreateSpendingSubcategoryService } from '@/backend/services/createSpendingSubcategoryService';
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

const createSpendingSubcategory = async (
  spendingSubcategoryId,
  spendingCategoryId,
  name,
  monthlySpendGoal,
  yearlySpendGoal
) => {
  const session = await getSession();
  if (!session) {
    return false;
  }
  const tenantId = session.user.tenant_id;

  const service = new CreateSpendingSubcategoryService({
    SpendingSubcategoryRepositoryFactory: SpendingSubcategoryRepository,
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

export { createSpendingCategory, createSpendingSubcategory };
