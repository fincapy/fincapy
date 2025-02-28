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
    let transaction;
    let oldTransactionCategory;
    console.log('categoryId', categoryId);
    const category = this.categories.find(
      (category) => category.categoryId === categoryId
    );
    console.log('category', category);
    oldTransactionCategory = category.name;
    if (subcategoryId) {
      const subcategory = category.subcategories.find(
        (subcategory) => subcategory.subcategoryId === subcategoryId
      );
      oldTransactionCategory = category.name + ' - ' + subcategory.name;
      transaction = subcategory.transactions.find(
        (tran) => tran.transactionId === transactionId
      );
    } else {
      transaction = category.transactions.find(
        (tran) => tran.transactionId === transactionId
      );
    }
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    let newTransactionCategory = oldTransactionCategory;
    if (newCategoryId) {
      newTransactionCategory = this.recategorizeTransaction({
        transactionId,
        newCategoryId,
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
        oldTransactionCategory,
        newTransactionCategory,
      });
      this.transactionEdits.push(transactionEdit);
    }
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  recategorizeTransaction({ transactionId, newCategoryId }) {
    let oldCategory;
    let oldSubcategory;
    let transaction;
    let newCategory;
    let newSubcategory;
    this.categories.forEach((category) => {
      if (category.categoryId === newCategoryId) {
        newCategory = category;
      }
      category.transactions.forEach((tran) => {
        if (tran.transactionId === transactionId) {
          oldCategory = category;
          transaction = tran;
        }
      });
      category.subcategories.forEach((subcat) => {
        if (subcat.subcategoryId === newCategoryId) {
          newCategory = category;
          newSubcategory = subcat;
        }
        subcat.transactions.forEach((tran) => {
          if (tran.transactionId === transactionId) {
            oldCategory = category;
            oldSubcategory = subcat;
            transaction = tran;
          }
        });
      });
    });
    if (oldCategory) {
      oldCategory.deleteTransaction({ transactionId });
    }
    if (oldSubcategory) {
      oldSubcategory.deleteTransaction({ transactionId });
    }
    if (newCategory) {
      newCategory.transactions.push(transaction);
    }
    if (newSubcategory) {
      newSubcategory.transactions.push(transaction);
    }
    const oldCategoryName = oldSubcategory
      ? oldCategory.name + ' - ' + oldSubcategory.name
      : oldCategory.name;
    const newCategoryName = newSubcategory
      ? newCategory.name + ' - ' + newSubcategory.name
      : newCategory.name;
    return newCategoryName;
  }

  toTransactionsView() {
    let transactions = [];
    this.categories.forEach((category) => {
      category.transactions.forEach((transaction) => {
        transaction.categoryName = `${this.capitalize(category.type)} - ${category.name}`;
        transaction.categoryId = category.categoryId;
        transaction.subcategoryId = null;
        transactions.push(transaction);
      });
      category.subcategories.forEach((subcategory) => {
        subcategory.transactions.forEach((transaction) => {
          transaction.categoryName = `${this.capitalize(category.type)} - ${category.name} - ${subcategory.name}`;
          transaction.categoryId = category.categoryId;
          transaction.subcategoryId = subcategory.subcategoryId;
          transactions.push(transaction);
        });
      });
    });
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    return transactions;
  }

  toView() {
    const planView = { ...this };
    planView.categories = planView.categories.map((category) => {
      category.transactions = category.transactions.filter((transaction) => {
        return (
          parse(transaction.date, 'yyyy-MM-dd', new Date()) >=
            planView.startDate &&
          parse(transaction.date, 'yyyy-MM-dd', new Date()) <= planView.endDate
        );
      });
      category.subcategories = category.subcategories.map((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (transaction) => {
            return (
              parse(transaction.date, 'yyyy-MM-dd', new Date()) >=
                planView.startDate &&
              parse(transaction.date, 'yyyy-MM-dd', new Date()) <=
                planView.endDate
            );
          }
        );
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
        category.toSpendingView(this.startDate, this.endDate, fractionOfMonths);
        categories.push(category);
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
        category.toIncomeView(this.startDate, this.endDate, fractionOfMonths);
        categories.push(category);
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
        category.toSpendingView(this.startDate, this.endDate, fractionOfMonths);
        net -= category.currentNet;
      } else if (category.type === 'income') {
        category.toIncomeView(this.startDate, this.endDate, fractionOfMonths);
        net += category.currentNet;
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
    // Calculate years difference
    const yearsDifference = this.endDate.getFullYear() - this.startDate.getFullYear();
    
    // Calculate months difference
    const monthsDifference = this.endDate.getMonth() - this.startDate.getMonth();
    
    // Total months between dates (inclusive of both start and end months)
    const monthsBetween = yearsDifference * 12 + monthsDifference + 1;
    
    return monthsBetween;
  }
}

export { Plan };
