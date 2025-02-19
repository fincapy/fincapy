class EditTransactionService {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute({
    tenantId,
    planId,
    transactionId,
    categoryId,
    subcategoryId,
    date,
    description,
    status,
    type,
    amount,
    newCategoryId,
  }) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const tenant = await tenantRepository.get({
        tenantId,
      });
      const plan = tenant.plans.find((plan) => plan.planId === planId);
      console.log('plan', plan);
      console.log('transactionId', transactionId);
      plan.editTransaction({
        transactionId,
        description,
        status,
        type,
        amount,
        date,
        categoryId,
        subcategoryId,
        newCategoryId,
      });
      await tenantRepository.set({ tenantId, tenant });
    });
  }
}

export { EditTransactionService };
