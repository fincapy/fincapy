import {
  categoryTable,
  subcategoryTable,
  transactionTable,
} from '../adapters/orm';
import { eq, or, gte, lte, and } from 'drizzle-orm';
import { SpendingCategory } from '../domain/spendingCategory';
import { IncomeCategory } from '../domain/incomeCategory';
import { SavingsCategory } from '../domain/savingsCategory';
import { Subcategory } from '../domain/subcategory';
import { Transaction } from '../domain/transaction';
import { Budget } from '../domain/plan';

class CategoriesView {
  constructor(tx) {
    this.tx = tx;
  }

  async get({ tenantId, startDate, endDate }) {
    const rows = await this.tx
      .select()
      .from(categoryTable)
      .where(eq(categoryTable.tenantId, tenantId))
      .leftJoin(
        subcategoryTable,
        eq(subcategoryTable.categoryId, categoryTable.categoryId)
      )
      .leftJoin(
        transactionTable,
        and(
          or(
            eq(transactionTable.categoryId, categoryTable.categoryId),
            eq(transactionTable.categoryId, subcategoryTable.subcategoryId)
          ),
          gte(transactionTable.date, startDate),
          lte(transactionTable.date, endDate)
        )
      );

    const result = [];
    rows.forEach((row) => {
      // Find or create the category
      let category = result.find(
        (c) => c.categoryId === row.category.categoryId
      );
      if (!category) {
        if (row.category.type === 'spending') {
          category = new SpendingCategory({
            categoryId: row.category.categoryId,
            name: row.category.name,
            type: row.category.type,
            monthlyGoal: row.category.monthlyGoal,
            transactions: [],
            subcategories: [],
          });
        } else if (row.category.type === 'income') {
          category = new IncomeCategory({
            categoryId: row.category.categoryId,
            name: row.category.name,
            type: row.category.type,
            monthlyGoal: row.category.monthlyGoal,
            transactions: [],
            subcategories: [],
          });
        } else if (row.category.type === 'savings') {
          category = new SavingsCategory({
            categoryId: row.category.categoryId,
            name: row.category.name,
            type: row.category.type,
            monthlyGoal: row.category.monthlyGoal,
            transactions: [],
            subcategories: [],
          });
        }
        result.push(category);
      }

      if (row.transaction?.categoryId === category.categoryId) {
        const transaction = {
          amount: row.transaction.amount,
          date: row.transaction.date,
          description: row.transaction.description,
          status: row.transaction.status,
          category: row.category.name,
          categoryId: row.transaction.categoryId,
          type: row.transaction.type,
        };
        category.transactions.push(transaction);
      }

      // Find or create the subcategory
      if (row.subcategory) {
        let subcategory = category.subcategories.find(
          (sub) => sub.subcategoryId === row.subcategory.subcategoryId
        );
        if (!subcategory) {
          subcategory = new Subcategory({
            subcategoryId: row.subcategory.subcategoryId,
            name: row.subcategory.name,
            monthlyGoal: row.subcategory.monthlyGoal,
            isImmutable: row.subcategory.isImmutable,
            transactions: [],
          });
          category.subcategories.push(subcategory);
        }

        if (row.transaction?.categoryId === subcategory.subcategoryId) {
          const transaction = {
            amount: row.transaction.amount,
            date: row.transaction.date,
            description: row.transaction.description,
            status: row.transaction.status,
            category: row.category.name,
            categoryId: row.transaction.categoryId,
            type: row.transaction.type,
          };
          subcategory.transactions.push(transaction);
          category.transactions.push(transaction);
        }
      }
    });

    const budget = new Budget({
      startDate,
      endDate,
      categories: result,
    });
    budget.categories = budget.categories.filter((category) => {
      return category.type === 'income';
    });
    budget.prorateMonthlyGoals();
    budget.categories.forEach((category) => {
      category.setCurrentIncome();

      category.subcategories.forEach((subcategory) => {
        if (subcategory.type === 'income') {
          subcategory.setCurrentIncome();
        }
      });
    });

    budget.categories = budget.categories.map((category) => {
      return Object.assign({}, category);
    });
    budget.categories.forEach((category) => {
      category.subcategories = category.subcategories.map((subcategory) => {
        return Object.assign({}, subcategory);
      });
    });
    return budget.categories;
  }
}

export { CategoriesView };
