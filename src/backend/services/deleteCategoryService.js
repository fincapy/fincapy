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
    const categoryToDelete = plan.categories.find(
      (category) => category.categoryId === categoryId
    );
    const uncategorizedCategory = plan.categories.find(
      (category) => category.name === 'Uncategorized'
    );
    categoryToDelete.transactions.forEach((transaction) => {
      uncategorizedCategory.transactions.push(transaction);
    });
    categoryToDelete.subcategories.forEach((subcategory) => {
      subcategory.transactions.forEach((transaction) => {
        uncategorizedCategory.transactions.push(transaction);
      });
    });
    plan.categories = plan.categories.filter(
      (category) => category.categoryId !== categoryId
    );
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { DeleteCategoryService };
