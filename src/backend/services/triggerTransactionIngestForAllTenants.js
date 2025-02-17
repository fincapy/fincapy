import { TransactionIngestRequestedMessage } from '../adapters/messages.js';

class TriggerTransactionIngestForAllTenants {
  constructor({ transactionManager }) {
    this.transactionManager = transactionManager;
  }

  async execute() {
    await this.transactionManager.transaction(
      async ({ tenantRepository, messageRepository }) => {
        const tenants = await tenantRepository.getAllTenantIds();
        for (const tenantId of tenants) {
          const message = new TransactionIngestRequestedMessage({
            topicName: 'transaction-ingest-requested',
            tenantId,
          });
          await messageRepository.add({
            message,
            messageType: 'TRANSACTION_INGEST_REQUESTED',
          });
          console.log('message added');
        }
      }
    );
  }
}

export { TriggerTransactionIngestForAllTenants };
