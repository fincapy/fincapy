class SavingsCategoriesView {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async get({ tenantId, planId, startDate, endDate }) {
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.startDate = startDate;
    plan.endDate = endDate;
    return plan.toSavingsView();
  }
}

export { SavingsCategoriesView };
