class Subcategory {
  constructor({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
    createdAt,
    updatedAt,
    isImmutable,
  }) {
    this.tenantId = tenantId;
    this.subcategoryId = subcategoryId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlySpendGoal = monthlySpendGoal;
    this.yearlySpendGoal = yearlySpendGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isImmutable = isImmutable;
  }
}

export { Subcategory };
