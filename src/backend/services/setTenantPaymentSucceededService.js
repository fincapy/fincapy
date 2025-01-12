class SetTenantPaymentSucceededService {
  constructor(tenantRepository, auth0Adapter) {
    this.tenantRepository = tenantRepository;
    this.auth0Adapter = auth0Adapter;
  }

  async execute(email) {
    const user = await this.auth0Adapter.getUserByEmail(email);
    const tenantId = user.app_metadata.tenant_id;
    const tenant = await this.tenantRepository.getWithTransaction({
      tenantId,
    });
    tenant.billingStatus = 'active';
    await this.tenantRepository.set({ tenantId, tenant });
    return true;
  }
}

export { SetTenantPaymentSucceededService };
