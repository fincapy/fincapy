class UpdateSubcategoryService {
  constructor({ planRepository }) {
    this.planRepository = planRepository;
  }

  async execute({ tenantId, subcategoryId, name, monthlyGoal, planId }) {
    const plan = await this.planRepository.get({ tenantId });
    plan.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        if (subcategory.subcategoryId === subcategoryId) {
          subcategory.name = name;
          subcategory.monthlyGoal = monthlyGoal;
        }
      });
    });
    await this.planRepository.put({ tenantId, planId, plan });
  }
}

export { UpdateSubcategoryService };
