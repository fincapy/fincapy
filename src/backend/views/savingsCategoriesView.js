class SavingsCategoriesView {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async get({ tenantId, planId, startDate, endDate }) {
    const tenant = await this.tenantRepository.get({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.startDate = startDate;
    plan.endDate = endDate;
    return plan.toSavingsView();
  }
}

export { SavingsCategoriesView };
