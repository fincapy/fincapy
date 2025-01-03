class CategoriesView {
  constructor(repository) {
    this.repository = repository;
  }

  async get({ tenantId, planId, startDate, endDate }) {
    const response = await this.repository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.startDate = startDate;
    plan.endDate = endDate;
    return plan.toSpendingView();
  }
}

export { CategoriesView };
