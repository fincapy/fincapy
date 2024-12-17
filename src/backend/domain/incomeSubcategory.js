import { Subcategory } from './subcategory';

class IncomeSubcategory extends Subcategory {
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
    super({});
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

export { IncomeSubcategory };
