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

export { PlaidItemCreatedMessage };
