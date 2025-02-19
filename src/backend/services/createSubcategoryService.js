import { Subcategory } from '../domain/subcategory';

class CreateSubcategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    tenantId,
    categoryId,
    planId,
    name,
    monthlyGoal,
    isImmutable,
  }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({ tenantId });
      if (tenant === null) {
        return;
      }
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      const category = plan.categories.find(
        (category) => category.categoryId === categoryId
      );
      category.createSubcategory({ name, monthlyGoal, isImmutable });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { CreateSubcategoryService };
