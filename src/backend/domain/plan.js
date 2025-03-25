import { Category } from './category.js';
import { parse } from 'date-fns';
import { TransactionEdit } from './transactionEdit.js';
import { Transaction } from './transaction.js';
import { v4 as uuidv4 } from 'uuid';

class Plan {
  constructor({ planId, categories, transactionEdits, startDate, endDate }) {
    this.planId = planId;
    this.categories = categories;
    this.startDate = startDate;
    this.endDate = endDate;
    this.transactionEdits = transactionEdits;
  }

  clone() {
    return new Plan({
      ...this,
      categories: this.categories.map((category) => category.clone()),
    });
  }

  createTransaction({
    categoryId,
    date,
    description,
    status,
    type,
    amount,
    transactionId,
  }) {
    this.categories.forEach((category) => {
      if (category.categoryId === categoryId) {
        const transaction = new Transaction({
          transactionId,
          date,
          description,
          status,
          type,
          amount,
          createdByUser: true,
        });
        category.transactions.push(transaction);
      } else {
        category.subcategories.forEach((subcategory) => {
          if (subcategory.subcategoryId === categoryId) {
            const transaction = new Transaction({
              transactionId,
              date,
              description,
              status,
              type,
              amount,
              createdByUser: true,
            });
            subcategory.transactions.push(transaction);
          }
        });
      }
    });
  }

  deleteTransaction({ transactionId }) {
    this.categories.forEach((category) => {
      category.transactions = category.transactions.filter(
        (transaction) => transaction.transactionId !== transactionId
      );

      category.subcategories.forEach((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (transaction) => transaction.transactionId !== transactionId
        );
      });
    });
  }

  deleteSubcategory({ subcategoryId, categoryId, type }) {
    const uncategorizedCategory = this.categories.find(
      (category) => category.type === type && category.name === 'Uncategorized'
    );
    const category = this.categories.find(
      (category) => category.categoryId === categoryId
    );
    const subcategoryToDelete = category.subcategories.find(
      (subcategory) => subcategory.subcategoryId === subcategoryId
    );
    uncategorizedCategory.transactions.push(
      ...subcategoryToDelete.transactions
    );
    category.deleteSubcategory({ subcategoryId });
  }

  updateCategory({ categoryId, name, monthlyGoal }) {
    const category = this.categories.find(
      (category) => category.categoryId === categoryId
    );
    category.name = name;
    category.monthlyGoal = monthlyGoal;
  }

  addCategory({ categoryId, name, monthlyGoal, type, isImmutable }) {
    if (
      this.categories.find((category) => category.categoryId === categoryId)
    ) {
      throw new Error('Category already exists');
    }
    const category = new Category({
      categoryId,
      type,
      name,
      monthlyGoal,
      isImmutable,
      transactions: [],
      subcategories: [],
      rank: 100000,
    });
    this.categories.push(category);
  }

  deleteCategory({ categoryId }) {
    const categoryToDelete = this.categories.find(
      (category) => category.categoryId === categoryId
    );
    if (!categoryToDelete) {
      throw new Error('Category not found');
    }
    const uncategorizedCategory = this.categories.find(
      (category) =>
        category.type === categoryToDelete.type &&
        category.name === 'Uncategorized'
    );
    uncategorizedCategory.transactions.push(...categoryToDelete.transactions);
    categoryToDelete.subcategories.forEach((subcategory) => {
      uncategorizedCategory.transactions.push(...subcategory.transactions);
    });
    this.categories = this.categories.filter(
      (category) => category.categoryId !== categoryId
    );
  }

  editTransaction({
    transactionId,
    categoryId,
    subcategoryId,
    date,
    description,
    status,
    type,
    newCategoryId,
    amount,
  }) {
    let originalTransactionCategoryName;
    let transaction;
    const originalCategory = this.categories.find(
      (category) => category.categoryId === categoryId
    );
    const originalSubcategory = originalCategory.subcategories.find(
      (subcategory) => subcategory.subcategoryId === subcategoryId
    );
    if (originalSubcategory) {
      originalTransactionCategoryName =
        originalCategory.name + ' - ' + originalSubcategory.name;
      transaction = originalSubcategory.transactions.find(
        (transaction) => transaction.transactionId === transactionId
      );
      originalSubcategory.transactions =
        originalSubcategory.transactions.filter(
          (existingTransaction) =>
            existingTransaction.transactionId !== transaction.transactionId
        );
    } else {
      originalTransactionCategoryName = originalCategory.name;
      transaction = originalCategory.transactions.find(
        (transaction) => transaction.transactionId === transactionId
      );
      originalCategory.transactions = originalCategory.transactions.filter(
        (existingTransaction) =>
          existingTransaction.transactionId !== transaction.transactionId
      );
    }

    let newCategoryOrSubcategory;
    let newTransactionCategoryName;
    newCategoryOrSubcategory = this.categories.find(
      (category) => category.categoryId === newCategoryId
    );
    if (newCategoryOrSubcategory) {
      newTransactionCategoryName = newCategoryOrSubcategory.name;
      newCategoryOrSubcategory.transactions.push(transaction);
    } else {
      this.categories.forEach((category) => {
        const subcategory = category.subcategories.find(
          (subcategory) => subcategory.subcategoryId === newCategoryId
        );
        if (subcategory) {
          subcategory.transactions.push(transaction);
          newCategoryOrSubcategory = subcategory;
          newTransactionCategoryName = category.name + ' - ' + subcategory.name;
        }
      });
    }

    let oldTransactionDescription = transaction.description;
    let newTransactionDescription = description;
    let oldTransactionType = transaction.type;
    let newTransactionType = type;

    transaction.date = date;
    transaction.description = description;
    transaction.status = status;
    transaction.type = type;
    transaction.amount = amount;

    if (!transaction.createdByUser) {
      const transactionEdit = new TransactionEdit({
        oldTransactionDescription,
        newTransactionDescription,
        oldTransactionType,
        newTransactionType,
        oldTransactionCategory: originalTransactionCategoryName,
        newTransactionCategory: newTransactionCategoryName,
      });
      this.transactionEdits.push(transactionEdit);
    }
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  toTransactionsView() {
    let transactions = [];
    this.categories.forEach((category) => {
      category.transactions.forEach((transaction) => {
        const transactionDate = parse(
          transaction.date,
          'yyyy-MM-dd',
          new Date()
        );
        transaction.categoryName = `${this.capitalize(category.type)} - ${category.name}`;
        transaction.categoryId = category.categoryId;
        transaction.subcategoryId = null;
        if (
          this.startDate <= transactionDate &&
          transactionDate <= this.endDate
        ) {
          transactions.push(transaction);
        }
      });
      category.subcategories.forEach((subcategory) => {
        subcategory.transactions.forEach((transaction) => {
          const transactionDate = parse(
            transaction.date,
            'yyyy-MM-dd',
            new Date()
          );
          transaction.categoryName = `${this.capitalize(category.type)} - ${category.name} - ${subcategory.name}`;
          transaction.categoryId = category.categoryId;
          transaction.subcategoryId = subcategory.subcategoryId;
          if (
            this.startDate <= transactionDate &&
            transactionDate <= this.endDate
          ) {
            transactions.push(transaction);
          }
        });
      });
    });
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  }

  toView() {
    const planView = { ...this };
    planView.categories = planView.categories.map((category) => {
      category.subcategories = category.subcategories.map((subcategory) => {
        return { ...subcategory };
      });
      return { ...category };
    });
    return planView;
  }

  toSpendingView() {
    let categories = [];
    const fractionOfMonths = this.getFractionOfMonths();
    this.categories.forEach((category) => {
      if (category.type === 'spending') {
        const newCategory = category.clone();
        newCategory.toSpendingView(
          this.startDate,
          this.endDate,
          fractionOfMonths
        );
        categories.push(newCategory);
      }
    });
    categories.sort((a, b) => a.rank - b.rank);
    return categories;
  }

  toIncomeView() {
    let categories = [];
    const fractionOfMonths = this.getFractionOfMonths();
    this.categories.forEach((category) => {
      if (category.type === 'income') {
        const newCategory = category.clone();
        newCategory.toIncomeView(
          this.startDate,
          this.endDate,
          fractionOfMonths
        );
        categories.push(newCategory);
      }
    });
    categories.sort((a, b) => a.rank - b.rank);
    return categories;
  }

  toSavingsView() {
    let categories = [];
    let net = 0;
    const fractionOfMonths = this.getFractionOfMonths();
    this.categories.forEach((category) => {
      if (category.type === 'spending') {
        const newCategory = category.clone();
        newCategory.toSpendingView(
          this.startDate,
          this.endDate,
          fractionOfMonths
        );
        net -= newCategory.currentNet;
      } else if (category.type === 'income') {
        const newCategory = category.clone();
        newCategory.toIncomeView(
          this.startDate,
          this.endDate,
          fractionOfMonths
        );
        net += newCategory.currentNet;
      }
    });
    const savingsCategory = this.categories.find(
      (category) => category.type === 'savings'
    );
    savingsCategory.currentNet = net;
    savingsCategory.toSavingsView(fractionOfMonths);
    savingsCategory.allocateToSubcategories();
    categories.push(savingsCategory);
    return categories;
  }

  calculateSavings() {
    let savings = 0;
    for (const category of this.categories) {
      if (category.type === 'spending') {
        savings -= category.getCurrentSpending();
      }

      if (category.type === 'income') {
        savings += category.getCurrentIncome();
      }
    }
    return savings;
  }

  setSavings() {
    this.categories.forEach((category) => {
      if (category.type === 'savings') {
        category.currentSavings = this.calculateSavings();
      }
    });
  }

  getFractionOfMonths() {
    let totalFraction = 0;

    // Clone the start date to avoid modifying the original
    let currentDate = new Date(this.startDate.getTime());

    // Set to first day of month to help with calculations
    const firstDayCurrentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Process each month in the range
    while (
      currentDate.getFullYear() < this.endDate.getFullYear() ||
      (currentDate.getFullYear() === this.endDate.getFullYear() &&
        currentDate.getMonth() <= this.endDate.getMonth())
    ) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

      // Days in current month
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // Calculate start day for counting
      let startDay = 1;
      if (
        year === this.startDate.getFullYear() &&
        month === this.startDate.getMonth()
      ) {
        startDay = this.startDate.getDate();
      }

      // Calculate end day for counting
      let endDay = daysInMonth;
      if (
        year === this.endDate.getFullYear() &&
        month === this.endDate.getMonth()
      ) {
        endDay = this.endDate.getDate();
      }

      // Calculate fraction of this month
      const daysIncluded = endDay - startDay + 1;
      const monthFraction = daysIncluded / daysInMonth;

      totalFraction += monthFraction;

      // Move to first day of next month
      currentDate.setMonth(month + 1);
      currentDate.setDate(1);
    }

    return totalFraction;
  }
}

export { Plan };
