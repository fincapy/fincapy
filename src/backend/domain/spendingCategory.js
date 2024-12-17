import { Category } from './category';

class SpendingCategory extends Category {
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
  }) {
    super({});
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
    this.currentSpending = 0;
  }

  getCurrentSpending() {
    let currentSpending = 0;
    this.transactions.forEach((transaction) => {
      currentSpending += transaction.amount;
    });
    return currentSpending;
  }

  setCurrentSpending() {
    this.currentSpending = this.getCurrentSpending();
  }
}

export { SpendingCategory };
