class ReorderCategoriesService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  resortArray(array, oldIndex, newIndex) {
    const result = [...array];
    const [movedItem] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, movedItem);
    return result;
  }

  async execute({ tenantId, planId, type, oldIndex, newIndex }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      const categories = plan.categories.filter(
        (category) => category.type === type
      );
      categories.sort((a, b) => a.rank - b.rank);
      const newCategories = this.resortArray(categories, oldIndex, newIndex);
      const newCategoryIdToPosition = {};
      newCategories.forEach((newCategory, index) => {
        newCategoryIdToPosition[newCategory.categoryId] = index;
      });
      plan.categories.forEach((planCategory) => {
        if (planCategory.type === type) {
          planCategory.rank = newCategoryIdToPosition[planCategory.categoryId];
        }
      });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { ReorderCategoriesService };
