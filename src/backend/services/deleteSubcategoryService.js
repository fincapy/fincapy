class DeleteSubcategoryService {
  constructor({ planRepository }) {
    this.planRepository = planRepository;
  }
  async execute({ tenantId, subcategoryId, planId }) {
    const plan = await this.planRepository.get({ tenantId });
    plan.categories.forEach((category) => {
      category.subcategories = category.subcategories.filter(
        (subcategory) => subcategory.subcategoryId !== subcategoryId
      );
    });
    await this.planRepository.put({ tenantId, planId, plan });
  }
}

export { DeleteSubcategoryService };
