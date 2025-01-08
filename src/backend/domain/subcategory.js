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
    transactions,
    rank,
  }) {
    this.tenantId = tenantId;
    this.subcategoryId = subcategoryId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlyGoal = monthlyGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.isImmutable = isImmutable;
    this.transactions = transactions;
    this.proratedGoal = 0;
    this.currentNet = 0;
    this.rank = rank;
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
    this.currentNet = currentSpending;
  }

  toIncomeView(category, startDate, endDate, fractionOfMonths) {
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
        transaction.categoryName = category.name + ' - ' + this.name;
        transactions.push(transaction);
        category.transactions.push(transaction);
      }
    });
    this.transactions = transactions;
    this.currentNet = currentIncome;
  }

  prorateMonthlyGoal(fractionOfMonths) {
    const unroundedGoal = fractionOfMonths * this.monthlyGoal;
    this.proratedGoal = Math.round(unroundedGoal * 100) / 100;
  }
}

export { Subcategory };
