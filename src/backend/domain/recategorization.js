class Recategorization {
  constructor({
    createdAt,
    transactionDescription,
    oldCategoryName,
    newCategoryName,
  }) {
    this.createdAt = createdAt;
    this.transactionDescription = transactionDescription;
    this.oldCategoryName = oldCategoryName;
    this.newCategoryName = newCategoryName;
  }
}

export { Recategorization };
