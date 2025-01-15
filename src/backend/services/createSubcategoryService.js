import { Subcategory } from '../domain/subcategory';

class CreateSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({
    tenantId,
    categoryId,
    planId,
    name,
    monthlyGoal,
    isImmutable,
  }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const category = plan.categories.find(
      (category) => category.categoryId === categoryId
    );
    category.createSubcategory({ name, monthlyGoal, isImmutable });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { CreateSubcategoryService };
