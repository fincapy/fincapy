class CreateTransactionService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    tenantId,
    planId,
    categoryId,
    date,
    description,
    status,
    type,
    amount,
  }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      if (!tenant) {
        throw new Error('Tenant not found');
      }
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      plan.createTransaction({
        categoryId,
        date,
        description,
        status,
        type,
        amount,
      });
      await tenantRepository.set({ tenantId, tenant });
      return true;
    });
  }
}

export { CreateTransactionService };
