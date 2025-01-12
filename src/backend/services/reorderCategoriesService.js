class ReorderCategoriesService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  resortArray(array, oldIndex, newIndex) {
    const result = [...array];
    const [movedItem] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, movedItem);
    return result;
  }

  async execute({ tenantId, planId, type, oldIndex, newIndex }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
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
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { ReorderCategoriesService };
