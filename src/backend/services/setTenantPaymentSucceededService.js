class SetTenantPaymentSucceededService {
  constructor(transactionManager) {
    this.transactionManager = transactionManager;
  }

  async execute(email) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository }) => {
        const user = await userRepository.getByEmail({ email });
        const tenant = await tenantRepository.get({
          tenantId: user.tenantId,
        });
        tenant.billingStatus = 'active';
        await tenantRepository.set({
          tenantId: user.tenantId,
          tenant,
        });
        return true;
      }
    );
  }
}

export { SetTenantPaymentSucceededService };
