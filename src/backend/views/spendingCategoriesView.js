class CategoriesView {
  constructor(repository) {
    this.repository = repository;
  }

  async get({ tenantId, planId, startDate, endDate }) {
    const tenant = await this.repository.get({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.startDate = startDate;
    plan.endDate = endDate;
    plan.prorateMonthlyGoals();
    plan.setSavings();
    plan.categories.forEach((category) => {
      if (category.type === 'spending') {
        category.setCurrentSpending();
      } else if (category.type === 'income') {
        category.setCurrentIncome();
      }

      category.subcategories.forEach((subcategory) => {
        if (subcategory.type === 'spending') {
          subcategory.setCurrentSpending();
        } else if (subcategory.type === 'income') {
          subcategory.setCurrentIncome();
        }
      });
    });

    plan.categories = plan.categories.map((category) => {
      return Object.assign({}, category);
    });
    plan.categories.forEach((category) => {
      category.subcategories = category.subcategories.map((subcategory) => {
        return Object.assign({}, subcategory);
      });
    });
    plan.categories = plan.categories.filter((category) => {
      return category.type === 'spending' || category.type === 'savings';
    });
    return plan.categories;
  }
}

export { CategoriesView };
