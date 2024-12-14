import { categoryTable } from '../orm';
import { eq, and } from 'drizzle-orm';
import { Category } from '@/backend/domain/category';

class CategoryRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, categoryId }) {
    const categoryObject = await this.tx
      .select()
      .from(categoryTable)
      .where(
        and(
          eq(categoryTable.tenantId, tenantId),
          eq(categoryTable.categoryId, categoryId)
        )
      );

    if (categoryObject.length === 0) {
      return null;
    }

    return new Category({
      tenantId: categoryObject[0].tenantId,
      categoryId: categoryObject[0].categoryId,
      name: categoryObject[0].name,
      monthlySpendingGoal: categoryObject[0].monthlySpendingGoal,
      createdAt: categoryObject[0].createdAt,
      updatedAt: categoryObject[0].updatedAt,
      isImmutable: categoryObject[0].isImmutable,
    });
  }

  async add(category) {
    await this.tx.insert(categoryTable).values({ ...category });
  }

  async update(category) {
    await this.tx
      .update(categoryTable)
      .set({ ...category })
      .where(
        and(
          eq(categoryTable.tenantId, category.tenantId),
          eq(categoryTable.categoryId, category.categoryId)
        )
      );
  }

  async remove(category) {
    await this.tx
      .delete(categoryTable)
      .where(
        and(
          eq(categoryTable.tenantId, category.tenantId),
          eq(categoryTable.categoryId, category.categoryId)
        )
      );
  }
}

export { CategoryRepository };
