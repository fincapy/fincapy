class IncomeCategory {
  constructor({
    tenantId,
    incomeCategoryId,
    name,
    monthlyIncomeGoal,
    createdAt,
    updatedAt,
    isImmutable,
  }) {
    this.tenantId = tenantId;
    this.incomeCategoryId = incomeCategoryId;
    this.name = name;
    this.monthlyIncomeGoal = monthlyIncomeGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isImmutable = isImmutable;
  }
}

export { IncomeCategory };
