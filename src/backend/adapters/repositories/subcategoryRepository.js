import { subcategoryTable } from '../orm';
import { eq, and } from 'drizzle-orm';
import { Subcategory } from '@/backend/domain/subcategory';

class SubcategoryRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, subcategoryId }) {
    const subcategoryObject = await this.tx
      .select()
      .from(subcategoryTable)
      .where(
        and(
          eq(subcategoryTable.tenantId, tenantId),
          eq(subcategoryTable.subcategoryId, subcategoryId)
        )
      );

    if (subcategoryObject.length === 0) {
      return null;
    }

    return new Subcategory({
      tenantId: subcategoryObject[0].tenantId,
      subcategoryId: subcategoryObject[0].subcategoryId,
      spendingCategoryId: subcategoryObject[0].spendingCategoryId,
      name: subcategoryObject[0].name,
      monthlySpendGoal: subcategoryObject[0].monthlySpendGoal,
      yearlySpendGoal: subcategoryObject[0].yearlySpendGoal,
      createdAt: subcategoryObject[0].createdAt,
      updatedAt: subcategoryObject[0].updatedAt,
    });
  }

  async add(subcategory) {
    await this.tx.insert(subcategoryTable).values({ ...subcategory });
  }

  async update(subcategory) {
    await this.tx
      .update(subcategoryTable)
      .set(subcategory)
      .where(
        and(
          eq(subcategoryTable.tenantId, subcategory.tenantId),
          eq(subcategoryTable.subcategoryId, subcategory.subcategoryId)
        )
      );
  }

  async remove(subcategory) {
    await this.tx
      .delete(subcategoryTable)
      .where(
        and(
          eq(subcategoryTable.tenantId, subcategory.tenantId),
          eq(subcategoryTable.subcategoryId, subcategory.subcategoryId)
        )
      );
  }
}

export { SubcategoryRepository };
