import {
  spendingCategoryTable,
  spendingSubcategoryTable,
} from '../adapters/orm';
import { eq } from 'drizzle-orm';

class SpendingCategoriesView {
  constructor(tx) {
    this.tx = tx;
  }

  async get({ tenantId }) {
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
      );

    const spendingCategories = rows.reduce((acc, row) => {
      const { spending_category, spending_subcategory } = row;

      if (!acc[spending_category.spendingCategoryId]) {
        acc[spending_category.spendingCategoryId] = {
          ...spending_category,
          spendingSubcategories: [],
        };
      }

      if (spending_subcategory) {
        acc[spending_category.spendingCategoryId].spendingSubcategories.push(
          spending_subcategory
        );
      }

      return acc;
    }, {});
    return Object.values(spendingCategories);
  }
}

export { SpendingCategoriesView };
