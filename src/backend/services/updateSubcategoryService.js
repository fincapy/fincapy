class UpdateSubcategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    tenantId,
    subcategoryId,
    name,
    monthlyGoal,
    planId,
    categoryId,
    icon,
  }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      const category = plan.categories.find(
        (category) => category.categoryId === categoryId
      );
      category.updateSubcategory({ subcategoryId, name, monthlyGoal, icon });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { UpdateSubcategoryService };
