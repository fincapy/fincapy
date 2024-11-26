import { CategoryTable, SubcategoryTable } from '../orm';
import { eq } from 'drizzle-orm';

class CategoriesView {
  constructor(tx) {
    this.tx = tx;
  }

  async get({ tenantId }) {
    const categories = await this.tx
      .select()
      .from(CategoryTable)
      .where(eq(CategoryTable.tenantId, tenantId))
      .leftJoin(
        SubcategoryTable,
        eq(SubcategoryTable.categoryId, CategoryTable.categoryId)
      );
    return categories;
  }
}

export default CategoriesView;
