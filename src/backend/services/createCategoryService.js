import { Category } from '@/backend/domain/category';

class CreateCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({
    tenantId,
    planId,
    categoryId,
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
    plan.categories.forEach((category) => {
      if (category.categoryId === categoryId) {
        throw new Error('Category already exists');
      }
    });
    const category = new Category({
      tenantId,
      categoryId,
      type,
      name,
      monthlyGoal,
      createdAt: new Date(),
      updatedAt: new Date(),
      isImmutable,
      transactions: [],
      subcategories: [],
    });
    plan.categories.push(category);
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { CreateCategoryService };
