import { PlaidItem } from '@/backend/domain/plaidItem';
import { PlaidItemCreatedMessage } from '@/backend/adapters/messages';

class CreatePlaidItemService {
  constructor({ plaidItemRepositoryFactory, db, plaidAdapter, pubsubAdapter }) {
    this.plaidItemRepositoryFactory = plaidItemRepositoryFactory;
    this.outboxRepositoryFactory = outboxRepositoryFactory;
    this.db = db;
    this.plaidAdapter = plaidAdapter;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId, institutionName, publicToken }) {
    await this.db.transaction(async (tx) => {
      const outboxRepository = new this.outboxRepositoryFactory({ tx });
      const plaidItemRepository = new this.plaidItemRepositoryFactory({ tx });

      const accessToken = await this.plaidAdapter.exchangePublicToken({
        publicToken,
      });

      const existingPlaidItem = await plaidItemRepository.get({
        tenantId,
        institutionId,
      });

      if (existingPlaidItem) {
        throw new Error('Plaid item already exists');
      }

      const plaidItem = new PlaidItem({
        institutionId,
        institutionName,
        tenantId,
        accessToken,
      });
      await plaidItemRepository.add(plaidItem);

      const plaidItemCreatedMessage = new PlaidItemCreatedMessage({
        tenantId,
        institutionId,
      });
      await outboxRepository.add(plaidItemCreatedMessage);
    });

    await this.db.transaction(async (tx) => {
      const outboxRepository = new this.outboxRepositoryFactory({ tx });
      await this.pubsubAdapter.publish({
        topicName: 'plaid-items',
        data: plaidItemCreatedMessage,
      });
      await outboxRepository.delete(plaidItemCreatedMessage.messageId);
    });
  }
}

export { CreatePlaidItemService };
