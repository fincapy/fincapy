class SetTenantPaymentFailedService {
  constructor(tenantRepository, auth0Adapter, plaidAdapter) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
    this.plaidAdapter = plaidAdapter;
  }

  async execute(email) {
    const user = await this.auth0Adapter.getUserByEmail(email);
    const tenantId = user.app_metadata.tenant_id;
    const [tenant, etag] = await this.tenantRepository.get({
      tenantId,
    });
    tenant.billingStatus = 'payment_failed';
    tenant.failedBillingAttempts += 1;
    if (tenant.failedBillingAttempts >= 3) {
      tenant.billingStatus = 'cancelled';
      tenant.plaidItems.forEach((plaidItem) => {
        this.plaidAdapter.deleteItem({ accessToken: plaidItem.accessToken });
      });
    }
    await this.tenantRepository.put({ tenantId, tenant, etag });
    return true;
  }
}

export { SetTenantPaymentFailedService };
