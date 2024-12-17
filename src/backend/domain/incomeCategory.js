import { Category } from './category';

class IncomeCategory extends Category {
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
    this.currentIncome = 0;
  }

  getCurrentIncome() {
    let currentIncome = 0;
    this.transactions.forEach((transaction) => {
      currentIncome += transaction.amount;
    });
    return currentIncome;
  }

  setCurrentIncome() {
    this.currentIncome = this.getCurrentIncome();
  }
}

export { IncomeCategory };
