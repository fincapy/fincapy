class Message {
  constructor({ topicName }) {
    this.messageId = crypto.randomUUID();
    this.createdAt = new Date();
    this.topicName = topicName;
    this.payload = {};
  }
}

class PlaidItemCreatedMessage extends Message {
  constructor({ topicName, tenantId, institutionId }) {
    super({ topicName });
    this.payload = { tenantId, institutionId, eventType: 'PLAID_ITEM_CREATED' };
  }
}

class TransactionCreatedMessage extends Message {
  constructor({
    topicName,
    tenantId,
    transactionId,
    date,
    amount,
    merchantName,
    counterparties,
    category,
    categoryConfidenceLevel,
    pending,
    originalDescription,
    accountType,
    subAccountType,
  }) {
    super({ topicName });
    this.payload = {
      tenantId,
      transactionId,
      date,
      amount,
      merchantName,
      counterparties,
      category,
      categoryConfidenceLevel,
      pending,
      originalDescription,
      eventType: 'TRANSACTION_CREATED',
      accountType,
      subAccountType,
    };
  }
}

class TransactionUpdatedMessage extends Message {
  constructor({
    topicName,
    tenantId,
    transactionId,
    date,
    amount,
    merchantName,
    counterparties,
    category,
    categoryConfidenceLevel,
    pending,
    originalDescription,
    accountType,
    subAccountType,
  }) {
    super({ topicName });
    this.payload = {
      tenantId,
      transactionId,
      date,
      amount,
      merchantName,
      counterparties,
      category,
      categoryConfidenceLevel,
      pending,
      originalDescription,
      eventType: 'TRANSACTION_UPDATED',
      accountType,
      subAccountType,
    };
  }
}

class TransactionDeletedMessage extends Message {
  constructor({ topicName, tenantId, transactionId }) {
    super({ topicName });
    this.payload = {
      tenantId,
      transactionId,
      eventType: 'TRANSACTION_DELETED',
    };
  }
}

export {
  PlaidItemCreatedMessage,
  TransactionCreatedMessage,
  TransactionUpdatedMessage,
  TransactionDeletedMessage,
};
