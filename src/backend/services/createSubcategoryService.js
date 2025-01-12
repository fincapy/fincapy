import { Subcategory } from '../domain/subcategory';

class CreateSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({
    tenantId,
    subcategoryId,
    categoryId,
    planId,
    name,
    monthlyGoal,
    type,
    isImmutable,
  }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const subCategory = new Subcategory({
      tenantId,
      subcategoryId,
      type,
      name,
      monthlyGoal,
      createdAt: new Date(),
      updatedAt: new Date(),
      isImmutable,
      transactions: [],
      spendingPagePosition: 100000,
      incomePagePosition: 100000,
    });
    plan.categories.forEach((category) => {
      if (category.categoryId === categoryId) {
        category.subcategories.push(subCategory);
      }
    });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { CreateSubcategoryService };
