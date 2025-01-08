class ReorderSpendingCategoriesService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  resortArray(array, oldIndex, newIndex) {
    const result = [...array];
    const [movedItem] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, movedItem);
    return result;
  }

  async execute({ tenantId, planId, oldIndex, newIndex }) {
    const [tenant, etag] = await this.tenantRepository.get({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const spendingCategories = plan.categories.filter(
      (category) => category.type === 'spending'
    );
    spendingCategories.sort(
      (a, b) => a.spendingPagePosition - b.spendingPagePosition
    );
    const newSpendingCategories = this.resortArray(
      spendingCategories,
      oldIndex,
      newIndex
    );
    const newSpendingCategoryIdToPosition = {};
    newSpendingCategories.forEach((newSpendingCategory, index) => {
      newSpendingCategoryIdToPosition[newSpendingCategory.categoryId] = index;
    });
    plan.categories.forEach((planCategory) => {
      if (planCategory.type === 'spending') {
        planCategory.spendingPagePosition =
          newSpendingCategoryIdToPosition[planCategory.categoryId];
      }
    });
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { ReorderSpendingCategoriesService };
