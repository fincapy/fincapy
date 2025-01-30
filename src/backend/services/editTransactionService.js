class EditTransactionService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
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
    const tenant = await this.tenantRepository.getWithTransaction({
      tenantId,
    });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
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
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { EditTransactionService };
