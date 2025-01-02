class UpdateCategoryService {
  constructor({ planRepository }) {
    this.planRepository = planRepository;
  }

  async execute({ tenantId, categoryId, planId, name, monthlyGoal }) {
    const plan = await this.planRepository.get({ tenantId });
    const category = plan.categories.find((c) => c.categoryId === categoryId);
    category.name = name;
    category.monthlyGoal = monthlyGoal;
    await this.planRepository.put({ tenantId, planId, plan });
  }
}

export { UpdateCategoryService };
