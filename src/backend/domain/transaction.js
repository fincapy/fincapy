class Transaction {
  constructor({
    tenantId,
    transactionId,
    createdAt,
    updatedAt,
    categoryId,
    amount,
    date,
    description,
    category,
    type,
    status,
    plaidDetails,
  }) {
    this.tenantId = tenantId;
    this.transactionId = transactionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.categoryId = categoryId;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.category = category;
    this.type = type;
    this.status = status;
    this.plaidDetails = plaidDetails;
  }
}

export { Transaction };
