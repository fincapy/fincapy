class SpendingCategory {
  constructor({
    tenantId,
    spendingCategoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
    createdAt,
    updatedAt,
    isImmutable,
  }) {
    this.tenantId = tenantId;
    this.spendingCategoryId = spendingCategoryId;
    this.name = name;
    this.monthlySpendGoal = monthlySpendGoal;
    this.yearlySpendGoal = yearlySpendGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isImmutable = isImmutable;
  }
}

export { SpendingCategory };
