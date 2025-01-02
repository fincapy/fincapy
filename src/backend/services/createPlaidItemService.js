import { PlaidItem } from '@/backend/domain/plaidItem';
import { PlaidItemCreatedMessage } from '@/backend/adapters/messages';

class CreatePlaidItemService {
  constructor({ plaidItemRepository, plaidAdapter, pubsubAdapter }) {
    this.plaidItemRepository = plaidItemRepository;
    this.plaidAdapter = plaidAdapter;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId, institutionName, publicToken }) {
    const accessToken = await this.plaidAdapter.exchangePublicToken({
      publicToken,
    });
    const existingPlaidItem = await this.plaidItemRepository.get({
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
    plaidItemCreatedMessage = new PlaidItemCreatedMessage({
      tenantId,
      institutionId,
      topicName: 'plaid-item-created',
    });
    await this.pubsubAdapter.publish({
      topicName: 'plaid-item-created',
      message: plaidItemCreatedMessage,
    });
    await plaidItemRepository.put(plaidItem);
  }
}

export { CreatePlaidItemService };
