import { PlaidItem } from '@/backend/domain/plaidItem';
import { PlaidItemCreatedMessage } from '@/backend/adapters/messages';

class CreatePlaidItemService {
  constructor({ transactionManager, plaidAdapter }) {
    this.transactionManager = transactionManager;
    this.plaidAdapter = plaidAdapter;
  }

  async execute({
    plaidItemId,
    userId,
    tenantId,
    institutionId,
    institutionName,
    publicToken,
  }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, messageRepository }) => {
        const tenant = await tenantRepository.get({ tenantId });
        const existingPlaidItem = tenant.plaidItems.find(
          (plaidItem) =>
            plaidItem.institutionId == institutionId &&
            plaidItem.userId == userId
        );
        if (existingPlaidItem) {
          throw new Error('Plaid item already exists');
        }
        const { accessToken } = await this.plaidAdapter.exchangePublicToken({
          publicToken,
        });
        const plaidItem = new PlaidItem({
          userId: userId,
          plaidItemId,
          institutionId,
          institutionName,
          accessToken,
          cursor: null,
          status: 'active',
          lastIngestedAt: null,
        });
        tenant.plaidItems.push(plaidItem);
        await tenantRepository.set({ tenantId, tenant });
        const plaidItemCreatedMessage = new PlaidItemCreatedMessage({
          tenantId,
          institutionId,
          topicName: 'plaid-item-created',
        });
        await messageRepository.add({
          message: plaidItemCreatedMessage,
          messageType: 'PLAID_ITEM_CREATED',
        });
      }
    );
  }
}
export { CreatePlaidItemService };
