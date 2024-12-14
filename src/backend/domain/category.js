class Category {
  constructor({
    tenantId,
    categoryId,
    name,
    monthlySpendingGoal,
    yearlySpendGoal,
    createdAt,
    updatedAt,
    isImmutable,
  }) {
    this.tenantId = tenantId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlySpendingGoal = monthlySpendingGoal;
    this.yearlySpendGoal = yearlySpendGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isImmutable = isImmutable;
  }
}

export { Category };
