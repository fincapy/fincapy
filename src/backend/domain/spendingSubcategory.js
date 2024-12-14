import { Subcategory } from './subcategory';

class SpendingSubcategory extends Subcategory {
  constructor({
    tenantId,
    subcategoryId,
    name,
    monthlyGoal,
    createdAt,
    updatedAt,
    type,
    isImmutable,
    transactions,
  }) {
    this.tenantId = tenantId;
    this.subcategoryId = subcategoryId;
    this.name = name;
    this.monthlyGoal = monthlyGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.type = type;
    this.isImmutable = isImmutable;
    this.transactions = transactions;
    this.proratedGoal = 0;
  }

  getCurrentSpending() {
    let currentSpending = 0;
    this.transactions.forEach((transaction) => {
      currentSpending += transaction.amount;
    });
    return currentSpending;
  }
}

export { SpendingSubcategory };
