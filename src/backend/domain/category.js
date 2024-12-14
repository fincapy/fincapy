class Category {
  constructor({
    tenantId,
    categoryId,
    name,
    monthlySpendingGoal,
    createdAt,
    updatedAt,
    type,
    isImmutable,
  }) {
    this.tenantId = tenantId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlySpendingGoal = monthlySpendingGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.type = type;
    this.isImmutable = isImmutable;
  }
}

export { Category };
