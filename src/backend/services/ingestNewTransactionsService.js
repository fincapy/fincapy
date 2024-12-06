import {
  TransactionCreatedMessage,
  TransactionUpdatedMessage,
  TransactionDeletedMessage,
} from '../adapters/messages';

class IngestNewTransactionsService {
  constructor({
    plaidAdapter,
    plaidItemRepositoryFactory,
    outboxRepositoryFactory,
    db,
    pubsubAdapter,
  }) {
    this.plaidAdapter = plaidAdapter;
    this.plaidItemRepositoryFactory = plaidItemRepositoryFactory;
    this.outboxRepositoryFactory = outboxRepositoryFactory;
    this.db = db;
    this.pubsubAdapter = pubsubAdapter;
  }

  async execute({ tenantId, institutionId }) {
    let transactionCreatedMessages = [];
    let transactionUpdatedMessages = [];
    let transactionDeletedMessages = [];
    await this.db.transaction(async (tx) => {
      const plaidItemRepository = new this.plaidItemRepositoryFactory({ tx });
      const outboxRepository = new this.outboxRepositoryFactory({ tx });
      const plaidItem = await plaidItemRepository.get({
        tenantId,
        institutionId,
      });
      if (!plaidItem) {
        throw new Error('Plaid item not found');
      }

      try {
        await this.plaidAdapter.refreshTransactions({
          accessToken: plaidItem.accessToken,
        });
      } catch (error) {}

      const transactions = await this.plaidAdapter.getTransactions({
        accessToken: plaidItem.accessToken,
        cursor: plaidItem.cursor,
      });

      if (transactions.added.length > 0) {
        for (const transaction of transactions.added) {
          const transactionCreatedMessage = new TransactionCreatedMessage({
            tenantId,
            transactionId: transaction.transaction_id,
            date: transaction.date,
            amount: transaction.amount,
            merchantName: transaction.merchant_name,
            counterparties: transaction.counterparties.map((counterparty) => ({
              name: counterparty.name,
              type: counterparty.type,
              confidenceLevel: counterparty.confidence_level,
            })),
            category: transaction.personal_finance_category.primary,
            categoryConfidenceLevel:
              transaction.personal_finance_category.confidence_level,
            pending: transaction.pending,
            originalDescription: transaction.original_description,
            accountType: transactions.accounts[transaction.account_id].type,
            subAccountType:
              transactions.accounts[transaction.account_id].subtype,
          });
          transactionCreatedMessages.push(transactionCreatedMessage);
          await outboxRepository.add(transactionCreatedMessage);
        }
      }

      if (transactions.modified.length > 0) {
        for (const transaction of transactions.modified) {
          const transactionUpdatedMessage = new TransactionUpdatedMessage({
            tenantId,
            transactionId: transaction.transaction_id,
            date: transaction.date,
            amount: transaction.amount,
            merchantName: transaction.merchant_name,
            counterparties: transaction.counterparties.map((counterparty) => ({
              name: counterparty.name,
              type: counterparty.type,
              confidenceLevel: counterparty.confidence_level,
            })),
            category: transaction.personal_finance_category.primary,
            categoryConfidenceLevel:
              transaction.personal_finance_category.confidence_level,
            pending: transaction.pending,
            originalDescription: transaction.original_description,
            accountType: transactions.accounts[transaction.account_id].type,
            subAccountType:
              transactions.accounts[transaction.account_id].subtype,
          });
          transactionUpdatedMessages.push(transactionUpdatedMessage);
          await outboxRepository.add(transactionUpdatedMessage);
        }
      }

      if (transactions.removed.length > 0) {
        for (const transaction of transactions.removed) {
          const transactionDeletedMessage = new TransactionDeletedMessage({
            tenantId,
            transactionId: transaction.transaction_id,
          });
          transactionDeletedMessages.push(transactionDeletedMessage);
          await outboxRepository.add(transactionDeletedMessage);
        }
      }
    });

    await this.db.transaction(async (tx) => {
      const outboxRepository = new this.outboxRepositoryFactory({ tx });

      if (transactionCreatedMessages.length > 0) {
        for (const transactionCreatedMessage of transactionCreatedMessages) {
          this.pubsubAdapter.publish({
            topicName: 'transaction-created',
            message: transactionCreatedMessage,
          });
          await outboxRepository.delete(transactionCreatedMessage.messageId);
        }
      }

      if (transactionUpdatedMessages.length > 0) {
        for (const transactionUpdatedMessage of transactionUpdatedMessages) {
          this.pubsubAdapter.publish({
            topicName: 'transaction-updated',
            message: transactionUpdatedMessage,
          });
          await outboxRepository.delete(transactionUpdatedMessage.messageId);
        }
      }

      if (transactionDeletedMessages.length > 0) {
        for (const transactionDeletedMessage of transactionDeletedMessages) {
          this.pubsubAdapter.publish({
            topicName: 'transaction-deleted',
            message: transactionDeletedMessage,
          });
          await outboxRepository.delete(transactionDeletedMessage.messageId);
        }
      }
    });
    return true;
  }
}

export { IngestNewTransactionsService };
