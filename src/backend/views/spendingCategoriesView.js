class SpendingCategoriesView {
  constructor(repository) {
    this.repository = repository;
  }

  async get({ tenantId, planId, startDate, endDate }) {
    const tenant = await this.repository.get({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.startDate = startDate;
    plan.endDate = endDate;
    return plan.toSpendingView();
  }
}

export { SpendingCategoriesView };
