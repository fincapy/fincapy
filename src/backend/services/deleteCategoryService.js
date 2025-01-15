class DeleteCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, categoryId, planId }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.deleteCategory({ categoryId });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { DeleteCategoryService };
