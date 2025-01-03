import { Subcategory } from './subcategory';
import { parse } from 'date-fns';
import { spendingTransactionTypes } from './transaction';

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
    this.currentSpending = 0;
  }

  toSpendingView(category, startDate, endDate, fractionOfMonths) {
    const transactions = [];
    let currentSpending = 0;
    this.prorateMonthlyGoal(fractionOfMonths);
    this.transactions.forEach((transaction) => {
      const transactionDate = parse(transaction.date, 'yyyy-MM-dd', new Date());
      if (
        transactionDate >= startDate &&
        transactionDate <= endDate &&
        spendingTransactionTypes.includes(transaction.type)
      ) {
        currentSpending += transaction.amount;
        transaction.categoryName = category.name + ' - ' + this.name;
        transactions.push(transaction);
        category.transactions.push(transaction);
      }
    });
    this.transactions = transactions;
    this.currentSpending = currentSpending;
  }

  prorateMonthlyGoal(fractionOfMonths) {
    const unroundedGoal = fractionOfMonths * this.monthlyGoal;
    this.proratedGoal = Math.round(unroundedGoal * 100) / 100;
  }
}

export { SpendingSubcategory };
