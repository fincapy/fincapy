import { PlaidItem } from '@/backend/domain/plaidItem';
import { PlaidItemCreatedMessage } from '@/backend/adapters/messages';

class CreatePlaidItemService {
  constructor({
    plaidItemRepositoryFactory,
    outboxRepositoryFactory,
    db,
    plaidAdapter,
    pubsubAdapter,
  }) {
    this.plaidItemRepositoryFactory = plaidItemRepositoryFactory;
    this.outboxRepositoryFactory = outboxRepositoryFactory;
    this.db = db;
    this.plaidAdapter = plaidAdapter;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId, institutionName, publicToken }) {
    let plaidItemCreatedMessage = null;
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

      plaidItemCreatedMessage = new PlaidItemCreatedMessage({
        tenantId,
        institutionId,
        topicName: 'plaid-item-created',
      });
      await outboxRepository.add(plaidItemCreatedMessage);
    });

    await this.db.transaction(async (tx) => {
      const outboxRepository = new this.outboxRepositoryFactory({ tx });
      await this.pubsubAdapter.publish({
        topicName: 'plaid-item-created',
        message: plaidItemCreatedMessage,
      });
      await outboxRepository.delete(plaidItemCreatedMessage.messageId);
    });
  }
}

export { CreatePlaidItemService };
