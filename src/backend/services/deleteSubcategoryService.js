class DeleteSubcategoryService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }
  async execute({ tenantId, subcategoryId, planId }) {
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
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
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { DeleteSubcategoryService };
