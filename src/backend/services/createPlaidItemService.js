import { PlaidItem } from '@/backend/domain/plaidItem';

class CreatePlaidItemService {
  constructor({ plaidItemRepositoryFactory, db }) {
    this.plaidItemRepositoryFactory = plaidItemRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId, id, accessToken }) {
    await this.db.transaction(async (tx) => {
      const plaidItemRepository = new this.plaidItemRepositoryFactory({ tx });
      const existingPlaidItem = await plaidItemRepository.get({
        tenantId,
        plaidItemId: id,
      });

      if (existingPlaidItem) {
        throw new Error('Plaid item already exists');
      }

      const plaidItem = new PlaidItem({
        id,
        tenantId,
        accessToken,
      });
      await plaidItemRepository.add(plaidItem);
    });
  }
}

export { CreatePlaidItemService };
