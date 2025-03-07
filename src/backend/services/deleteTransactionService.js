class DeleteTransactionService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({ tenantId, planId, transactionId }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      if (tenant === null) {
        return;
      }
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      plan.deleteTransaction({ transactionId });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { DeleteTransactionService };
