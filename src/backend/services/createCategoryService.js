import { Category } from '@/backend/domain/category';

class CreateCategoryService {
  constructor({ planRepository }) {
    this.planRepository = planRepository;
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
    const plan = await this.planRepository.get({ tenantId });
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
    await this.planRepository.put({ tenantId, planId, plan });
  }
}

export { CreateCategoryService };
