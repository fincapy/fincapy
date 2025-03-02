import { PlaidItemUpdatedMessage } from '@/backend/adapters/messages';

class UpdatePlaidItemService {
  constructor({ transactionManager, plaidAdapter }) {
    this.transactionManager = transactionManager;
    this.plaidAdapter = plaidAdapter;
  }

  async execute({ tenantId, plaidItemId, publicToken }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, messageRepository }) => {
        const tenant = await tenantRepository.get({
          tenantId,
        });
        if (tenant === null) {
          return;
        }
        const existingPlaidItem = tenant.plaidItems.find(
          (plaidItem) => plaidItem.plaidItemId === plaidItemId
        );
        const { accessToken } = await this.plaidAdapter.exchangePublicToken({
          publicToken,
        });
        if (!existingPlaidItem) {
          throw new Error('Plaid item not found');
        }
        existingPlaidItem.status = 'active';
        existingPlaidItem.accessToken = accessToken;
        const plaidItemUpdatedMessage = new PlaidItemUpdatedMessage({
          tenantId,
          plaidItemId: existingPlaidItem.plaidItemId,
          topicName: 'plaid-item-updated',
        });
        await tenantRepository.set({ tenantId, tenant });
        await messageRepository.add({
          message: plaidItemUpdatedMessage,
          messageType: 'PLAID_ITEM_UPDATED',
        });
      }
    );
  }
}
export { UpdatePlaidItemService };
