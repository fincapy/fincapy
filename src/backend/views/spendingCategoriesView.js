import {
  spendingCategoryTable,
  spendingSubcategoryTable,
  transactionTable,
} from '../adapters/orm';
import { eq, or, gte, lte, and } from 'drizzle-orm';

class SpendingCategoriesView {
  constructor(tx) {
    this.tx = tx;
  }

  async get({ tenantId, startDate, endDate }) {
    const rows = await this.tx
      .select()
      .from(spendingCategoryTable)
      .where(eq(spendingCategoryTable.tenantId, tenantId))
      .leftJoin(
        spendingSubcategoryTable,
        eq(
          spendingSubcategoryTable.spendingCategoryId,
          spendingCategoryTable.spendingCategoryId
        )
      )
      .leftJoin(
        transactionTable,
        and(
          or(
            eq(
              transactionTable.categoryId,
              spendingCategoryTable.spendingCategoryId
            ),
            eq(
              transactionTable.categoryId,
              spendingSubcategoryTable.spendingSubcategoryId
            )
          ),
          gte(transactionTable.date, startDate),
          lte(transactionTable.date, endDate)
        )
      );

    const result = [];
    rows.forEach((row) => {
      // Find or create the category
      let category = result.find(
        (c) => c.spendingCategoryId === row.spending_category.spendingCategoryId
      );
      if (!category) {
        category = {
          name: row.spending_category.name,
          spendingCategoryId: row.spending_category.spendingCategoryId,
          monthlySpendGoal: row.spending_category.monthlySpendGoal,
          transactions: [],
          spendingSubcategories: [],
        };
        result.push(category);
      }

      // Add category-level transactions
      if (row.transaction?.categoryId === category.spendingCategoryId) {
        category.transactions.push({
          amount: row.transaction.amount,
          date: row.transaction.date,
          description: row.transaction.description,
          status: row.transaction.status,
          category: row.spending_category.name,
          categoryId: row.transaction.categoryId,
          transactionId: row.transaction.transactionId,
        });
      }

      // Find or create the subcategory
      if (row.spending_subcategory) {
        let subcategory = category.spendingSubcategories.find(
          (sub) =>
            sub.spendingSubcategoryId ===
            row.spending_subcategory.spendingSubcategoryId
        );
        if (!subcategory) {
          subcategory = {
            spendingSubcategoryId:
              row.spending_subcategory.spendingSubcategoryId,
            monthlySpendGoal: row.spending_subcategory.monthlySpendGoal,
            name: row.spending_subcategory.name,
            transactions: [],
          };
          category.spendingSubcategories.push(subcategory);
        }

        if (row.transaction?.categoryId === subcategory.spendingSubcategoryId) {
          subcategory.transactions.push({
            amount: row.transaction.amount,
            date: row.transaction.date,
            description: row.transaction.description,
            status: row.transaction.status,
            category: `${row.spending_category.name} - ${row.spending_subcategory.name}`,
            categoryId: row.transaction.categoryId,
            transactionId: row.transaction.transactionId,
          });

          category.transactions.push({
            amount: row.transaction.amount,
            date: row.transaction.date,
            description: row.transaction.description,
            status: row.transaction.status,
            category: `${row.spending_category.name} - ${row.spending_subcategory.name}`,
            categoryId: row.transaction.categoryId,
            transactionId: row.transaction.transactionId,
          });
        }
      }
    });
    return result;
  }
}

export { SpendingCategoriesView };
