class SetTenantPaymentSucceededService {
  constructor(transactionManager, auth0Adapter) {
    this.transactionManager = transactionManager;
    this.auth0Adapter = auth0Adapter;
  }

  async execute(email) {
    await this.transactionManager.transaction(async ({ tenantRepository }) => {
      const user = await this.auth0Adapter.getUserByEmail(email);
      const tenantId = user.app_metadata.tenant_id;
      const tenant = await tenantRepository.get({
        tenantId,
      });
      tenant.billingStatus = 'active';
      await tenantRepository.set({ tenantId, tenant });
      return true;
    });
  }
}

export { SetTenantPaymentSucceededService };
