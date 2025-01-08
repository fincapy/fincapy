import {
  spendingTransactionTypes,
  incomeTransactionTypes,
} from '@/backend/domain/transaction';

class Category {
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
    rank,
  }) {
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
    this.currentNet = 0;
    this.rank = rank;
  }

  toSpendingView(startDate, endDate, fractionOfMonths) {
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
        transaction.categoryName = this.name;
        transactions.push(transaction);
      }
    });
    this.transactions = transactions;
    this.currentNet = currentSpending;
    const subcategories = [];
    this.subcategories.forEach((subcategory) => {
      subcategory.toSpendingView(this, startDate, endDate, fractionOfMonths);
      subcategories.push(Object.assign({}, subcategory));
    });
    this.subcategories = subcategories;
  }

  toIncomeView(startDate, endDate, fractionOfMonths) {
    const transactions = [];
    let currentIncome = 0;
    this.prorateMonthlyGoal(fractionOfMonths);
    this.transactions.forEach((transaction) => {
      const transactionDate = parse(transaction.date, 'yyyy-MM-dd', new Date());
      if (
        transactionDate >= startDate &&
        transactionDate <= endDate &&
        incomeTransactionTypes.includes(transaction.type)
      ) {
        currentIncome += transaction.amount;
        transaction.categoryName = this.name;
        transactions.push(transaction);
      }
    });
    this.transactions = transactions;
    this.currentNet = currentIncome;
    const subcategories = [];
    this.subcategories.forEach((subcategory) => {
      subcategory.toIncomeView(this, startDate, endDate, fractionOfMonths);
      subcategories.push(Object.assign({}, subcategory));
    });
    this.subcategories = subcategories;
  }

  prorateMonthlyGoal(fractionOfMonths) {
    const unroundedGoal = fractionOfMonths * this.monthlyGoal;
    this.proratedGoal = Math.round(unroundedGoal * 100) / 100;
  }
}

export { Category };
