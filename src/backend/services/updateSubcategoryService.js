class UpdateSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, subcategoryId, name, monthlyGoal, planId }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.categories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        if (subcategory.subcategoryId === subcategoryId) {
          subcategory.name = name;
          subcategory.monthlyGoal = monthlyGoal;
        }
      });
    });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { UpdateSubcategoryService };
