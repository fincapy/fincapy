import { Category } from './category';
import { parse } from 'date-fns';
import { Recategorization } from './recategorization';
class Plan {
  constructor({ planId, categories, recategorizations, startDate, endDate }) {
    this.planId = planId;
    this.categories = categories;
    this.startDate = startDate;
    this.endDate = endDate;
    this.recategorizations = recategorizations;
  }

  clone() {
    return new Plan({
      ...this,
      categories: this.categories.map((category) => category.clone()),
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
    this.recategorizations.push(
      new Recategorization({
        createdAt: new Date(),
        transactionDescription: transaction.description,
        oldCategoryName,
        newCategoryName,
      })
    );
  }

  toTransactionsView() {
    let transactions = [];
    this.categories.forEach((category) => {
      category.transactions.forEach((transaction) => {
        transactions.push(transaction);
      });
      category.subcategories.forEach((subcategory) => {
        subcategory.transactions.forEach((transaction) => {
          transactions.push(transaction);
        });
      });
    });
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
        categories.push(Object.assign({}, category));
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
        categories.push(Object.assign({}, category));
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
        net += category.currentNet;
      } else if (category.type === 'income') {
        category.toIncomeView(this.startDate, this.endDate, fractionOfMonths);
        net += category.currentNet;
      }
    });
    const savingsCategory = this.categories.find(
      (category) => category.type === 'savings'
    );
    savingsCategory.currentNet = net;
    savingsCategory.allocateToSubcategories();
    savingsCategory.toSavingsView();
    categories.push(Object.assign({}, savingsCategory));
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
    let totalDaysInMonths = 0;

    let current = new Date(
      this.startDate.getFullYear(),
      this.startDate.getMonth(),
      1
    );
    while (current <= this.endDate) {
      const totalDaysInMonth = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      );
      totalDaysInMonths += totalDaysInMonth.getDate();

      current.setMonth(current.getMonth() + 1);
    }

    const differenceInMilliseconds = this.endDate - this.startDate;
    const daysBetween =
      Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24)) + 1;

    const factor = daysBetween / totalDaysInMonths;

    const yearsDifference =
      this.endDate.getFullYear() - this.startDate.getFullYear();
    const monthsDifference =
      this.endDate.getMonth() - this.startDate.getMonth();
    const monthsBetween = yearsDifference * 12 + monthsDifference + 1;

    return factor * monthsBetween;
  }
}

export { Plan };
