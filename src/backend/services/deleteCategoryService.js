class DeleteCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, categoryId, planId }) {
    const tenant = await this.tenantRepository.get({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.categories = plan.categories.filter(
      (category) => category.categoryId !== categoryId
    );
    await this.tenantRepository.put({ tenantId, tenant });
  }
}

export { DeleteCategoryService };
