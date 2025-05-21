import { Category } from './category.js';
import { parse, format } from 'date-fns';
import { TransactionEdit } from './transactionEdit.js';
import { Transaction } from './transaction.js';
import { v4 as uuidv4 } from 'uuid';

class Plan {
  constructor({
    planId,
    categories,
    transactionEdits,
    startDate,
    endDate,
    transactions = [],
  }) {
    this.planId = planId;
    this.categories = categories;
    this.startDate = startDate;
    this.endDate = endDate;
    this.transactionEdits = transactionEdits;
    this.transactions = transactions;
  }

  clone() {
    return new Plan({
      planId: this.planId,
      categories: this.categories.map((category) => category.clone()),
      transactionEdits: this.transactionEdits,
      startDate: this.startDate,
      endDate: this.endDate,
      transactions: this.transactions.map((transaction) => {
        return new Transaction({ ...transaction });
      }),
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
    const transaction = new Transaction({
      transactionId,
      date,
      description,
      status,
      type,
      amount,
      createdByUser: true,
    });

    if (!categoryId) {
      this.transactions.push(transaction);
      return;
    }

    this.categories.forEach((category) => {
      if (category.categoryId === categoryId) {
        category.transactions.push(transaction);
      } else {
        category.subcategories.forEach((subcategory) => {
          if (subcategory.subcategoryId === categoryId) {
            subcategory.transactions.push(transaction);
          }
        });
      }
    });
  }

  deleteTransaction({ transactionId }) {
    this.transactions = this.transactions.filter(
      (transaction) => transaction.transactionId !== transactionId
    );

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
    let uncategorizedCategory;
    uncategorizedCategory = this.categories.find(
      (category) =>
        category.type === type && category.categoryId.includes('other')
    );
    if (!uncategorizedCategory) {
      uncategorizedCategory = this.categories.find(
        (category) => category.type === type && category.name === 'Other'
      );
    }
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

  addCategory({
    categoryId,
    otherSubcategoryId,
    name,
    monthlyGoal,
    type,
    isImmutable,
  }) {
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
    category.createSubcategory({
      subcategoryId: otherSubcategoryId,
      name: 'General',
      monthlyGoal: monthlyGoal,
      isImmutable: true,
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
    let uncategorizedCategory;
    uncategorizedCategory = this.categories.find(
      (category) =>
        category.type === categoryToDelete.type &&
        category.categoryId.includes('other')
    );
    if (!uncategorizedCategory) {
      uncategorizedCategory = this.categories.find(
        (category) =>
          category.type === categoryToDelete.type && category.name === 'Other'
      );
    }
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
    // Find and remove transaction from its current location
    const { transaction, originalCategoryName } = this.findAndRemoveTransaction(
      transactionId,
      categoryId,
      subcategoryId
    );

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Store original values for tracking changes
    const oldTransactionDescription = transaction.description;
    const oldTransactionType = transaction.type;

    // Update transaction properties
    transaction.date = date;
    transaction.description = description;
    transaction.status = status;
    transaction.type = type;
    transaction.amount = amount;

    // Move transaction to new location and get new category name
    const newCategoryName = this.moveTransactionToNewLocation(
      transaction,
      newCategoryId
    );

    // Record transaction edit history if not user-created
    if (!transaction.createdByUser) {
      this.recordTransactionEdit(
        oldTransactionDescription,
        description,
        oldTransactionType,
        type,
        originalCategoryName,
        newCategoryName
      );
    }
  }

  /**
   * Finds a transaction and removes it from its current location
   * @returns {Object} The transaction and its original category name
   */
  findAndRemoveTransaction(transactionId, categoryId, subcategoryId) {
    let transaction;
    let originalCategoryName = 'None';

    // Case 1: Transaction is at plan level
    if (!categoryId) {
      transaction = this.transactions.find(
        (transaction) => transaction.transactionId === transactionId
      );

      if (transaction) {
        this.transactions = this.transactions.filter(
          (existingTransaction) =>
            existingTransaction.transactionId !== transactionId
        );
      }

      return { transaction, originalCategoryName };
    }

    // Case 2: Transaction is in a category or subcategory
    const category = this.categories.find(
      (category) => category.categoryId === categoryId
    );

    if (!category) {
      return { transaction: null, originalCategoryName };
    }

    // Check if transaction is in a subcategory
    if (subcategoryId) {
      const subcategory = category.subcategories.find(
        (subcategory) => subcategory.subcategoryId === subcategoryId
      );

      if (subcategory) {
        transaction = subcategory.transactions.find(
          (transaction) => transaction.transactionId === transactionId
        );

        if (transaction) {
          originalCategoryName = `${category.name} - ${subcategory.name}`;
          subcategory.transactions = subcategory.transactions.filter(
            (existingTransaction) =>
              existingTransaction.transactionId !== transactionId
          );
        }
      }
    } else {
      // Check if transaction is directly in the category
      transaction = category.transactions.find(
        (transaction) => transaction.transactionId === transactionId
      );

      if (transaction) {
        originalCategoryName = category.name;
        category.transactions = category.transactions.filter(
          (existingTransaction) =>
            existingTransaction.transactionId !== transactionId
        );
      }
    }

    return { transaction, originalCategoryName };
  }

  /**
   * Moves a transaction to its new location
   * @returns {string} The name of the new category
   */
  moveTransactionToNewLocation(transaction, newCategoryId) {
    // Case 1: Move to plan level
    if (!newCategoryId) {
      this.transactions.push(transaction);
      return 'None';
    }

    // Case 2: Try to find category with this ID
    const category = this.categories.find(
      (category) => category.categoryId === newCategoryId
    );

    if (category) {
      category.transactions.push(transaction);
      return category.name;
    }

    // Case 3: Try to find subcategory with this ID
    for (const category of this.categories) {
      const subcategory = category.subcategories.find(
        (subcategory) => subcategory.subcategoryId === newCategoryId
      );

      if (subcategory) {
        subcategory.transactions.push(transaction);
        return `${category.name} - ${subcategory.name}`;
      }
    }

    // If we get here, the category/subcategory wasn't found
    // Add to plan level as fallback
    this.transactions.push(transaction);
    return 'None';
  }

  /**
   * Records a transaction edit in the history
   */
  recordTransactionEdit(
    oldDescription,
    newDescription,
    oldType,
    newType,
    oldCategory,
    newCategory
  ) {
    const transactionEdit = new TransactionEdit({
      oldTransactionDescription: oldDescription,
      newTransactionDescription: newDescription,
      oldTransactionType: oldType,
      newTransactionType: newType,
      oldTransactionCategory: oldCategory,
      newTransactionCategory: newCategory,
    });

    this.transactionEdits.push(transactionEdit);
  }

  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  toTransactionsView() {
    let transactions = [];
    this.transactions.forEach((transaction) => {
      const transactionDate = parse(transaction.date, 'yyyy-MM-dd', new Date());
      transaction.categoryName = 'None';
      transaction.categoryId = null;
      transaction.subcategoryId = null;
      if (
        this.startDate <= transactionDate &&
        transactionDate <= this.endDate
      ) {
        transactions.push(transaction);
      }
    });
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

        // Get the effective goal for view calculation using the new category method
        const effectiveMonthlyGoal =
          newCategory.getEffectiveMonthlyGoalForView();
        newCategory.monthlyGoal = effectiveMonthlyGoal;

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

        // Get the effective goal for view calculation using the new category method
        const effectiveMonthlyGoal =
          newCategory.getEffectiveMonthlyGoalForView();
        newCategory.monthlyGoal = effectiveMonthlyGoal;

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
