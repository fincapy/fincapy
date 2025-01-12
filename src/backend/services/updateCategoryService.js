class UpdateCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, categoryId, planId, name, monthlyGoal }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const category = plan.categories.find((c) => c.categoryId === categoryId);
    category.name = name;
    category.monthlyGoal = monthlyGoal;
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { UpdateCategoryService };
