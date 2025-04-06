import { Category } from '@/backend/domain/category';

class CreateCategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    tenantId,
    planId,
    categoryId,
    otherSubcategoryId,
    name,
    monthlyGoal,
    type,
    isImmutable,
  }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({ tenantId });
      if (tenant === null) {
        return;
      }
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      plan.addCategory({
        categoryId,
        otherSubcategoryId,
        name,
        monthlyGoal,
        type,
        isImmutable,
      });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { CreateCategoryService };
