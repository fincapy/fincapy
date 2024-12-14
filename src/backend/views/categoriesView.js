import {
  categoryTable,
  subcategoryTable,
  transactionTable,
} from '../adapters/orm';
import { eq, or, gte, lte, and } from 'drizzle-orm';

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
        category = {
          name: row.category.name,
          categoryId: row.category.categoryId,
          monthlyGoal: row.category.monthlyGoal,
          transactions: [],
          subcategories: [],
        };
        result.push(category);
      }

      // Add category-level transactions
      if (row.transaction?.categoryId === category.categoryId) {
        category.transactions.push({
          amount: row.transaction.amount,
          date: row.transaction.date,
          description: row.transaction.description,
          status: row.transaction.status,
          category: row.category.name,
          categoryId: row.transaction.categoryId,
          transactionId: row.transaction.transactionId,
        });
      }

      // Find or create the subcategory
      if (row.subcategory) {
        let subcategory = category.subcategories.find(
          (sub) => sub.subcategoryId === row.subcategory.subcategoryId
        );
        if (!subcategory) {
          subcategory = {
            subcategoryId: row.subcategory.subcategoryId,
            monthlyGoal: row.subcategory.monthlyGoal,
            name: row.subcategory.name,
            transactions: [],
          };
          category.subcategories.push(subcategory);
        }

        if (row.transaction?.categoryId === subcategory.subcategoryId) {
          subcategory.transactions.push({
            amount: row.transaction.amount,
            date: row.transaction.date,
            description: row.transaction.description,
            status: row.transaction.status,
            category: `${row.category.name} - ${row.subcategory.name}`,
            categoryId: row.transaction.categoryId,
            transactionId: row.transaction.transactionId,
          });

          category.transactions.push({
            amount: row.transaction.amount,
            date: row.transaction.date,
            description: row.transaction.description,
            status: row.transaction.status,
            category: `${row.category.name} - ${row.subcategory.name}`,
            categoryId: row.transaction.categoryId,
            transactionId: row.transaction.transactionId,
          });
        }
      }
    });
    return result;
  }
}

export { CategoriesView };
