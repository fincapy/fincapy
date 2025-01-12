class SetTenantCancelledService {
  constructor(tenantRepository, auth0Adapter) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
    this.plaidAdapter = plaidAdapter;
  }

  async execute(email) {
    const user = await this.auth0Adapter.getUserByEmail(email);
    const tenantId = user.app_metadata.tenant_id;
    const tenant = await this.tenantRepository.getWithTransaction({
      tenantId,
    });
    tenant.billingStatus = 'cancelled';
    tenant.plaidItems.forEach((plaidItem) => {
      this.plaidAdapter.deleteItem({ accessToken: plaidItem.accessToken });
    });
    await this.tenantRepository.set({ tenantId, tenant });
    return true;
  }
}

export { SetTenantCancelledService };
