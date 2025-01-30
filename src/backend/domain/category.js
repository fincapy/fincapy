import {
  spendingTransactionTypes,
  incomeTransactionTypes,
} from '@/backend/domain/transaction';
import { parse } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { Subcategory } from '@/backend/domain/subcategory';

class Category {
  constructor({
    categoryId,
    name,
    monthlyGoal,
    type,
    isImmutable,
    transactions,
    subcategories,
    rank,
  }) {
    this.categoryId = categoryId;
    this.name = name;
    this.monthlyGoal = monthlyGoal;
    this.type = type;
    this.isImmutable = isImmutable;
    this.transactions = transactions;
    this.subcategories = subcategories;
    this.proratedGoal = 0;
    this.currentNet = 0;
    this.rank = rank;
  }

  deleteSubcategory({ subcategoryId }) {
    this.subcategories = this.subcategories.filter(
      (subcategory) => subcategory.subcategoryId !== subcategoryId
    );
  }

  deleteTransaction({ transactionId }) {
    this.transactions = this.transactions.filter(
      (transaction) => transaction.transactionId !== transactionId
    );
  }

  createSubcategory({ name, monthlyGoal, isImmutable }) {
    const subcategoryId = uuidv4();
    this.subcategories.push(
      new Subcategory({
        name,
        monthlyGoal,
        subcategoryId,
        isImmutable,
        transactions: [],
        rank: 100000,
      })
    );
  }

  updateSubcategory({ subcategoryId, name, monthlyGoal }) {
    const subcategory = this.subcategories.find(
      (subcategory) => subcategory.subcategoryId === subcategoryId
    );
    subcategory.name = name;
    subcategory.monthlyGoal = monthlyGoal;
  }

  toSavingsView(fractionOfMonths) {
    const subcategories = [];
    this.prorateMonthlyGoal(fractionOfMonths);
    this.subcategories.forEach((subcategory) => {
      subcategory.toSavingsView(fractionOfMonths);
      subcategories.push(subcategory);
    });
    this.subcategories = subcategories;
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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
        transaction.categoryName = `${this.capitalize(this.type)} - ${this.name}`;
        transaction.categoryId = this.categoryId;
        transactions.push(transaction);
      }
    });
    this.transactions = transactions;
    this.currentNet = currentSpending;
    const subcategories = [];
    this.subcategories.forEach((subcategory) => {
      subcategory.toSpendingView(this, startDate, endDate, fractionOfMonths);
      subcategories.push(subcategory);
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
      subcategories.push(subcategory);
    });
    this.subcategories = subcategories;
  }

  prorateMonthlyGoal(fractionOfMonths) {
    const unroundedGoal = fractionOfMonths * this.monthlyGoal;
    this.proratedGoal = Math.round(unroundedGoal * 100) / 100;
  }

  allocateToSubcategories() {
    let amountLeft = this.currentNet;
    this.subcategories.forEach((subcategory) => {
      amountLeft -= subcategory.proratedGoal;
      const amountToAllocate = Math.min(
        Math.max(0, amountLeft),
        subcategory.proratedGoal
      );
      subcategory.currentNet = amountToAllocate;
    });
  }

  clone() {
    return new Category({
      ...this,
      transactions: this.transactions.map((transaction) => {
        return { ...transaction };
      }),
      subcategories: this.subcategories.map((subcategory) =>
        subcategory.clone()
      ),
    });
  }
}

export { Category };
