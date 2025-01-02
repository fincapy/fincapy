import { PlaidItem } from '@/backend/domain/plaidItem';
import { PlaidItemCreatedMessage } from '@/backend/adapters/messages';

class CreatePlaidItemService {
  constructor({ tenantRepository, plaidAdapter, pubsubAdapter }) {
    this.tenantRepository = tenantRepository;
    this.plaidAdapter = plaidAdapter;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId, institutionName, publicToken }) {
    const accessToken = await this.plaidAdapter.exchangePublicToken({
      publicToken,
    });
    const tenant = await this.tenantRepository.get({ tenantId });
    const existingPlaidItem = tenant.plaidItems.find(
      (plaidItem) => plaidItem.institutionId === institutionId
    );
    if (existingPlaidItem) {
      throw new Error('Plaid item already exists');
    }
    const plaidItem = new PlaidItem({
      institutionId,
      institutionName,
      tenantId,
      accessToken,
      cursor: null,
    });
    tenant.plaidItems.push(plaidItem);
    const plaidItemCreatedMessage = new PlaidItemCreatedMessage({
      tenantId,
      institutionId,
      topicName: 'plaid-item-created',
    });
    tenant.outbox.push(plaidItemCreatedMessage);
    await this.tenantRepository.put(tenant);

    await this.pubsubAdapter.publish({
      topicName: 'plaid-item-created',
      message: plaidItemCreatedMessage,
    });
    tenant.outbox.filter((message) => message !== plaidItemCreatedMessage);
    await this.tenantRepository.put({ tenantId, tenant });
  }
}
export { CreatePlaidItemService };
