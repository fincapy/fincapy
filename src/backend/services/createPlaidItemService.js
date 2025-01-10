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
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
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
    await this.tenantRepository.put({ tenantId, tenant, etag });

    const newResponse = await this.tenantRepository.get({ tenantId });
    if (newResponse === null) {
      return;
    }
    const [newTenant, newEtag] = newResponse;
    await this.pubsubAdapter.publish({
      topicName: 'plaid-item-created',
      message: plaidItemCreatedMessage,
    });
    newTenant.outbox.filter((message) => message !== plaidItemCreatedMessage);
    await this.tenantRepository.put({
      tenantId,
      tenant: newTenant,
      etag: newEtag,
    });
  }
}
export { CreatePlaidItemService };
