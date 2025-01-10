import { PlaidItemUpdatedMessage } from '@/backend/adapters/messages';

class UpdatePlaidItemService {
  constructor({ tenantRepository, plaidAdapter, pubsubAdapter }) {
    this.tenantRepository = tenantRepository;
    this.plaidAdapter = plaidAdapter;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId, publicToken }) {
    const response = await this.tenantRepository.get({ tenantId });
    if (response === null) {
      return;
    }
    const [tenant, etag] = response;
    const existingPlaidItem = tenant.plaidItems.find(
      (plaidItem) => plaidItem.institutionId === institutionId
    );
    const accessToken = await this.plaidAdapter.exchangePublicToken({
      publicToken,
    });
    if (!existingPlaidItem) {
      throw new Error('Plaid item not found');
    }
    existingPlaidItem.status = 'active';
    existingPlaidItem.accessToken = accessToken;
    const plaidItemUpdatedMessage = new PlaidItemUpdatedMessage({
      tenantId,
      institutionId,
      topicName: 'plaid-item-updated',
    });
    tenant.outbox.push(plaidItemUpdatedMessage);
    await this.tenantRepository.put({ tenantId, tenant, etag });

    const newResponse = await this.tenantRepository.get({ tenantId });
    if (newResponse === null) {
      return;
    }
    const [newTenant, newEtag] = newResponse;
    await this.pubsubAdapter.publish({
      topicName: 'plaid-item-updated',
      message: plaidItemUpdatedMessage,
    });
    newTenant.outbox.filter((message) => message !== plaidItemUpdatedMessage);
    await this.tenantRepository.put({
      tenantId,
      tenant: newTenant,
      etag: newEtag,
    });
  }
}
export { UpdatePlaidItemService };
