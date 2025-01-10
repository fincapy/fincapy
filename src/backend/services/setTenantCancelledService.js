class SetTenantCancelledService {
  constructor(tenantRepository, auth0Adapter) {
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
    tenant.billingStatus = 'cancelled';
    tenant.plaidItems.forEach((plaidItem) => {
      this.plaidAdapter.deleteItem({ accessToken: plaidItem.accessToken });
    });
    await this.tenantRepository.put({ tenantId, tenant, etag });
    return true;
  }
}

export { SetTenantCancelledService };
