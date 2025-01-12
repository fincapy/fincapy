import { PlaidItemUpdatedMessage } from '@/backend/adapters/messages';

class UpdatePlaidItemService {
  constructor({ tenantRepository, plaidAdapter, pubsubAdapter }) {
    this.tenantRepository = tenantRepository;
    this.plaidAdapter = plaidAdapter;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId, publicToken }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
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
    await this.tenantRepository.set({ tenantId, tenant });

    const newTenant = await this.tenantRepository.getWithTransaction({
      tenantId,
    });
    await this.pubsubAdapter.publish({
      topicName: 'plaid-item-updated',
      message: plaidItemUpdatedMessage,
    });
    newTenant.outbox.filter((message) => message !== plaidItemUpdatedMessage);
    await this.tenantRepository.set({ tenantId, tenant: newTenant });
  }
}
export { UpdatePlaidItemService };
