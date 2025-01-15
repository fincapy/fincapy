class UpdateSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({
    tenantId,
    subcategoryId,
    name,
    monthlyGoal,
    planId,
    categoryId,
  }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const category = plan.categories.find(
      (category) => category.categoryId === categoryId
    );
    category.updateSubcategory({ subcategoryId, name, monthlyGoal });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { UpdateSubcategoryService };
