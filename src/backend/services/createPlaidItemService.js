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
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const existingPlaidItem = tenant.plaidItems.find(
      (plaidItem) => plaidItem.institutionId === institutionId
    );
    if (existingPlaidItem) {
      throw new Error('Plaid item already exists');
    }
    const plaidItem = new PlaidItem({
      institutionId,
      institutionName,
      accessToken,
      cursor: null,
      status: 'active',
    });
    tenant.plaidItems.push(plaidItem);
    const plaidItemCreatedMessage = new PlaidItemCreatedMessage({
      tenantId,
      institutionId,
      topicName: 'plaid-item-created',
    });
    tenant.outbox.push(plaidItemCreatedMessage);
    await this.tenantRepository.set({ tenantId, tenant });

    const newTenant = await this.tenantRepository.getWithTransaction({
      tenantId,
    });
    if (newTenant === null) {
      return;
    }
    await this.pubsubAdapter.publish({
      topicName: 'plaid-item-created',
      message: plaidItemCreatedMessage,
    });
    newTenant.outbox.filter((message) => message !== plaidItemCreatedMessage);
    await this.tenantRepository.set({ tenantId, tenant: newTenant });
  }
}
export { CreatePlaidItemService };
