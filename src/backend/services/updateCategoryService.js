class UpdateCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, categoryId, planId, name, monthlyGoal }) {
    const tenant = await this.tenantRepository.get({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const category = plan.categories.find((c) => c.categoryId === categoryId);
    category.name = name;
    category.monthlyGoal = monthlyGoal;
    await this.tenantRepository.put({ tenantId, tenant });
  }
}

export { UpdateCategoryService };
