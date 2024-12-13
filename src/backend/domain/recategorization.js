class Recategorization {
  constructor({
    tenantId,
    recategorizationId,
    transactionId,
    oldCategoryId,
    newCategoryId,
    createdAt,
  }) {
    this.tenantId = tenantId;
    this.recategorizationId = recategorizationId;
    this.transactionId = transactionId;
    this.createdAt = createdAt;
    this.oldCategoryId = oldCategoryId;
    this.newCategoryId = newCategoryId;
  }
}

export { Recategorization };
