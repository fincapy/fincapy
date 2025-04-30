class SetTenantPaymentFailedService {
  constructor(transactionManager, plaidAdapter) {
    this.transactionManager = transactionManager;
    this.plaidAdapter = plaidAdapter;
  }

  async execute(email) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, userRepository }) => {
        const user = await userRepository.getByEmail({ email });
        const tenant = await tenantRepository.get({
          tenantId: user.tenantId,
        });
        tenant.billingStatus = 'payment_failed';
        tenant.failedBillingAttempts += 1;
        if (tenant.failedBillingAttempts >= 8) {
          tenant.billingStatus = 'cancelled';
          tenant.plaidItems.forEach((plaidItem) => {
            this.plaidAdapter.deleteItem({
              accessToken: plaidItem.accessToken,
            });
          });
        }
        tenant.plaidItems = [];
        await tenantRepository.set({
          tenantId: user.tenantId,
          tenant,
        });
        return true;
      }
    );
  }
}

export { SetTenantPaymentFailedService };
