class DeleteSubcategoryService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }
  async execute({ tenantId, subcategoryId, categoryId, planId, type }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      if (tenant === null) {
        return;
      }
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      plan.deleteSubcategory({ subcategoryId, categoryId, type });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { DeleteSubcategoryService };
