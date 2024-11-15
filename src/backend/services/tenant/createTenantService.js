import Tenant from '@/backend/domain/tenant';

class CreateTenantService {
  constructor({ tenantRepositoryFactory, db }) {
    this.tenantRepositoryFactory = tenantRepositoryFactory;
    this.db = db;
  }

  async execute(tenantId) {
    await this.db.transaction(async (tx) => {
      const tenantRepository = new this.tenantRepositoryFactory({ tx });
      const existingTenant = await tenantRepository.get(tenantId);

      if (existingTenant) {
        throw new Error('Tenant already exists');
      }

      const tenant = new Tenant({
        tenantId,
        plaidAccessToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await tenantRepository.add(tenant);
    });
  }
}

export default CreateTenantService;
