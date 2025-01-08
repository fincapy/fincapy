class ReorderSubcategoriesService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  resortArray(array, oldIndex, newIndex) {
    const newArray = [...array];
    const [removed] = newArray.splice(oldIndex, 1);
    newArray.splice(newIndex, 0, removed);
    return newArray;
  }

  async execute({ tenantId, planId, categoryId, oldIndex, newIndex }) {
    const [tenant, etag] = await this.tenantRepository.get({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    const category = plan.categories.find(
      (category) => category.categoryId === categoryId
    );
    const subcategories = category.subcategories;
    subcategories.sort((a, b) => a.rank - b.rank);
    const newSubcategories = this.resortArray(
      subcategories,
      oldIndex,
      newIndex
    );
    const newSubcategoryIdToPosition = {};
    newSubcategories.forEach((newSubcategory, index) => {
      newSubcategoryIdToPosition[newSubcategory.subcategoryId] = index;
    });
    category.subcategories.forEach((subcategory) => {
      subcategory.rank = newSubcategoryIdToPosition[subcategory.subcategoryId];
    });
    await this.tenantRepository.put({ tenantId, tenant, etag });
  }
}

export { ReorderSubcategoriesService };
