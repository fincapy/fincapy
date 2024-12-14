class Subcategory {
  constructor({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlySpendingGoal,
    createdAt,
    updatedAt,
    isImmutable,
  }) {
    this.tenantId = tenantId;
    this.subcategoryId = subcategoryId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlySpendingGoal = monthlySpendingGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isImmutable = isImmutable;
  }
}

export { Subcategory };
