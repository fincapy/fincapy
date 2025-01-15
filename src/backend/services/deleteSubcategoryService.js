class DeleteSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }
  async execute({ tenantId, subcategoryId, categoryId, planId, type }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.deleteSubcategory({ subcategoryId, categoryId, type });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { DeleteSubcategoryService };
