class UpdateCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, categoryId, planId, name, monthlyGoal }) {
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const category = plan.categories.find((c) => c.categoryId === categoryId);
    category.name = name;
    category.monthlyGoal = monthlyGoal;
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { UpdateCategoryService };
