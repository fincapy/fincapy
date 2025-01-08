class Category {
  constructor({
    tenantId,
    categoryId,
    name,
    monthlyGoal,
    createdAt,
    updatedAt,
    type,
    isImmutable,
    transactions,
    subcategories,
    spendingPagePosition,
    incomePagePosition,
  }) {
    this.tenantId = tenantId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlyGoal = monthlyGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.type = type;
    this.isImmutable = isImmutable;
    this.transactions = transactions;
    this.subcategories = subcategories;
    this.proratedGoal = 0;
    this.spendingPagePosition = spendingPagePosition;
    this.incomePagePosition = incomePagePosition;
  }
}

export { Category };
