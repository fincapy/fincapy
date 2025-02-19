class DeleteCategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ tenantId, categoryId, planId }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      if (tenant === null) {
        return;
      }
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      plan.deleteCategory({ categoryId });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { DeleteCategoryService };
