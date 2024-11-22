import { PlaidItem } from '@/backend/domain/plaidItem';
import { eq, and } from 'drizzle-orm';
import { plaidItemTable } from '../orm';

class PlaidItemRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, plaidItemId }) {
    const plaidItemObject = await this.tx
      .select()
      .from(plaidItemTable)
      .where(
        and(
          eq(plaidItemTable.tenantId, tenantId),
          eq(plaidItemTable.id, plaidItemId)
        )
      );

    if (plaidItemObject.length === 0) {
      return null;
    }

    return new PlaidItem({
      tenantId: plaidItemObject[0].tenant_id,
      id: plaidItemObject[0].id,
      accessToken: plaidItemObject[0].access_token,
    });
  }

  async add(plaidItem) {
    await this.tx.insert(plaidItemTable).values({ ...plaidItem });
  }
}

export { PlaidItemRepository };
