class DeleteSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }
  async execute({ tenantId, subcategoryId, planId }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const uncategorizedCategory = plan.categories.find(
      (category) => category.name === 'Uncategorized'
    );
    plan.categories.forEach((category) => {
      const subcategoryToDelete = category.subcategories.find(
        (subcategory) => subcategory.subcategoryId === subcategoryId
      );
      if (subcategoryToDelete) {
        subcategoryToDelete.transactions.forEach((transaction) => {
          uncategorizedCategory.transactions.push(transaction);
        });
        category.subcategories = category.subcategories.filter(
          (subcategory) => subcategory.subcategoryId !== subcategoryId
        );
      }
    });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { DeleteSubcategoryService };
