class Transaction {
  constructor({
    transactionId,
    updatedAt,
    amount,
    date,
    description,
    type,
    status,
  }) {
    this.transactionId = transactionId;
    this.updatedAt = updatedAt;
    this.amount = amount;
    this.date = date;
    this.description = description;
    this.type = type;
    this.status = status;
  }
}

export { Transaction };
