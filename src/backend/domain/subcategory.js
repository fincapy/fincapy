import { parse } from 'date-fns';
import {
  spendingTransactionTypes,
  incomeTransactionTypes,
} from './transaction';

class Subcategory {
  constructor({
    subcategoryId,
    name,
    monthlyGoal,
    isImmutable,
    transactions,
    rank,
  }) {
    this.subcategoryId = subcategoryId;
    this.name = name;
    this.monthlyGoal = monthlyGoal;
    this.isImmutable = isImmutable;
    this.transactions = transactions;
    this.proratedGoal = 0;
    this.currentNet = 0;
    this.rank = rank;
  }

  clone() {
    return new Subcategory({
      ...this,
    });
  }

  deleteTransaction({ transactionId }) {
    this.transactions = this.transactions.filter(
      (transaction) => transaction.transactionId !== transactionId
    );
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  toSavingsView(fractionOfMonths) {
    this.prorateMonthlyGoal(fractionOfMonths);
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
        transaction.categoryName = `${this.capitalize(category.type)} - ${category.name} - ${this.name}`;
        transaction.categoryId = this.subcategoryId;
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

  clone() {
    return new Subcategory({
      ...this,
      transactions: this.transactions.map((transaction) =>
        Object.assign({}, transaction)
      ),
    });
  }
}

export { Subcategory };
