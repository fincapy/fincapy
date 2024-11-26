import { PlaidItem } from '@/backend/domain/plaidItem';
import { eq, and } from 'drizzle-orm';
import { plaidItemTable } from '../orm';

class PlaidItemRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, institutionId }) {
    const plaidItemObject = await this.tx
      .select()
      .from(plaidItemTable)
      .where(
        and(
          eq(plaidItemTable.tenantId, tenantId),
          eq(plaidItemTable.institutionId, institutionId)
        )
      );

    if (plaidItemObject.length === 0) {
      return null;
    }

    return new PlaidItem({
      tenantId: plaidItemObject[0].tenantId,
      institutionId: plaidItemObject[0].institutionId,
      institutionName: plaidItemObject[0].institutionName,
      accessToken: plaidItemObject[0].accessToken,
    });
  }

  async add(plaidItem) {
    await this.tx.insert(plaidItemTable).values({ ...plaidItem });
  }
}

export { PlaidItemRepository };
