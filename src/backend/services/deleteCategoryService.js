class DeleteCategoryService {
  constructor({ planRepository }) {
    this.planRepository = planRepository;
  }

  async execute({ tenantId, categoryId, planId }) {
    const plan = await this.planRepository.get({ tenantId });
    plan.categories = plan.categories.filter(
      (category) => category.categoryId !== categoryId
    );
    await this.planRepository.put({ tenantId, planId, plan });
  }
}

export { DeleteCategoryService };
