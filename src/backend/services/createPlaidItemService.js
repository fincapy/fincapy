import { PlaidItem } from '@/backend/domain/plaidItem';
import { PlaidItemCreatedMessage } from '@/backend/adapters/messages';

class CreatePlaidItemService {
  constructor({ transactionManager, plaidAdapter }) {
    this.transactionManager = transactionManager;
    this.plaidAdapter = plaidAdapter;
  }

  async execute({ tenantId, institutionId, institutionName, publicToken }) {
    await this.transactionManager.transaction(
      async ({ tenantRepository, messageRepository }) => {
        const accessToken = await this.plaidAdapter.exchangePublicToken({
          publicToken,
        });
        const tenant = await tenantRepository.get({ tenantId });
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
        await tenantRepository.set({ tenantId, tenant });
        const plaidItemCreatedMessage = new PlaidItemCreatedMessage({
          tenantId,
          institutionId,
          topicName: 'plaid-item-created',
        });
        messageRepository.add({
          message: plaidItemCreatedMessage,
          messageType: 'PLAID_ITEM_CREATED',
        });
      }
    );
  }
}
export { CreatePlaidItemService };
