import Tenant from '@/backend/domain/tenant';
import { eq } from 'drizzle-orm';
import { tenantTable } from '../orm';

class TenantRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get(tenantId) {
    const tenantObject = await this.tx
      .select()
      .from(tenantTable)
      .where(eq(tenantTable.tenantId, tenantId));
    console.log('tenantObject', tenantObject);

    if (tenantObject.length === 0) {
      return null;
    }

    return new Tenant(
      tenantObject[0].tenantId,
      tenantObject[0].plaidAccessToken,
      tenantObject[0].createdAt,
      tenantObject[0].updatedAt
    );
  }

  async add(tenant) {
    await this.tx.insert(tenantTable).values({ ...tenant });
  }
}

export default TenantRepository;
