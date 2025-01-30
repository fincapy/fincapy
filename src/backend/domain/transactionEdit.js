class TransactionEdit {
  constructor({
    createdAt,
    oldTransactionDescription,
    newTransactionDescription,
    oldTransactionType,
    newTransactionType,
    oldTransactionCategory,
    newTransactionCategory,
  }) {
    this.createdAt = createdAt;
    this.oldTransactionDescription = oldTransactionDescription;
    this.newTransactionDescription = newTransactionDescription;
    this.oldTransactionType = oldTransactionType;
    this.newTransactionType = newTransactionType;
    this.oldTransactionCategory = oldTransactionCategory;
    this.newTransactionCategory = newTransactionCategory;
  }
}

export { TransactionEdit };
