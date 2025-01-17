class RecategorizeTransactionService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, transactionId, planId, newCategoryId }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.recategorizeTransaction({ transactionId, newCategoryId });
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { RecategorizeTransactionService };
