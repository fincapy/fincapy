class UpdateCategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ tenantId, categoryId, planId, name, monthlyGoal }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      if (tenant === null) {
        return;
      }
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      const category = plan.categories.find((c) => c.categoryId === categoryId);
      category.name = name;
      category.monthlyGoal = monthlyGoal;
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { UpdateCategoryService };
