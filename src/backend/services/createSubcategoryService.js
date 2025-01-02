import { Subcategory } from '../domain/subcategory';

class CreateSubcategoryService {
  constructor({ planRepository }) {
    this.planRepository = planRepository;
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
    const plan = await this.planRepository.get({ tenantId, planId });
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
    await this.planRepository.put({ tenantId, planId, plan });
  }
}

export { CreateSubcategoryService };
