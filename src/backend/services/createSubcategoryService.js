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
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
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
    });
    plan.categories.forEach((category) => {
      if (category.categoryId === categoryId) {
        category.subcategories.push(subCategory);
      }
    });
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { CreateSubcategoryService };
