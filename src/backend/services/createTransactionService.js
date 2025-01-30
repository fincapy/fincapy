class CreateTransactionService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
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
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
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
    await this.tenantRepository.set({ tenantId, tenant });
    return true;
  }
}

export { CreateTransactionService };
