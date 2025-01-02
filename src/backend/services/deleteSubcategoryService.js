class DeleteSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }
  async execute({ tenantId, subcategoryId, planId }) {
    const tenant = await this.tenantRepository.get({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.categories.forEach((category) => {
      category.subcategories = category.subcategories.filter(
        (subcategory) => subcategory.subcategoryId !== subcategoryId
      );
    });
    await this.tenantRepository.put({ tenantId, tenant });
  }
}

export { DeleteSubcategoryService };
