class Subcategory {
  constructor({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlyGoal,
    createdAt,
    updatedAt,
    isImmutable,
  }) {
    this.tenantId = tenantId;
    this.subcategoryId = subcategoryId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlyGoal = monthlyGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isImmutable = isImmutable;
  }
}

export { Subcategory };
