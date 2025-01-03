class DeleteCategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, categoryId, planId }) {
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
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
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { DeleteCategoryService };
