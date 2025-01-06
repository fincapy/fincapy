class SetTenantPaymentFailedService {
  constructor(tenantRepository, auth0Adapter) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
  }

  async execute(email) {
    const user = await this.auth0Adapter.getUserByEmail(email);
    const tenantId = user.app_metadata.tenant_id;
    const [tenant, etag] = await this.tenantRepository.get({
      tenantId,
    });
    tenant.billingStatus = 'payment_failed';
    await this.tenantRepository.put({ tenantId, tenant, etag });
    return true;
  }
}

export { SetTenantPaymentFailedService };
