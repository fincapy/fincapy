import { TransactionIngestRequestedMessage } from '../adapters/messages';

class TriggerTransactionIngestForAllTenants {
  constructor({ tenantRepository, pubsubAdapter }) {
    this.tenantRepository = tenantRepository;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute() {
    const tenants = await this.tenantRepository.getAllTenantIds();
    for (const tenantId of tenants) {
      const message = new TransactionIngestRequestedMessage({
        topicName: 'transaction-ingest-requested',
        tenantId,
      });
      this.pubsubAdapter.publish({ topicName: message.topicName, message });
    }
  }
}

export { TriggerTransactionIngestForAllTenants };
