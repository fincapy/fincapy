import { spendingSubcategoryTable } from '../orm';
import { eq, and } from 'drizzle-orm';
import { SpendingSubcategory } from '@/backend/domain/spendingSubcategory';

class SpendingSubcategoryRepository {
  constructor(tx) {
    this.tx = tx;
  }

  async get({ tenantId, spendingSubcategoryId }) {
    const spendingSubcategoryObject = await this.tx
      .select()
      .from(spendingSubcategoryTable)
      .where(
        and(
          eq(spendingSubcategoryTable.tenantId, tenantId),
          eq(spendingSubcategoryTable.subcategoryId, spendingSubcategoryId)
        )
      );

    if (spendingSubcategoryObject.length === 0) {
      return null;
    }

    return new SpendingSubcategory({
      tenantId: spendingSubcategoryObject[0].tenantId,
      subcategoryId: spendingSubcategoryObject[0].spendingSubcategoryId,
      categoryId: spendingSubcategoryObject[0].categoryId,
      name: spendingSubcategoryObject[0].name,
      monthlySpendGoal: spendingSubcategoryObject[0].monthlySpendGoal,
      yearlySpendGoal: spendingSubcategoryObject[0].yearlySpendGoal,
      createdAt: spendingSubcategoryObject[0].createdAt,
      updatedAt: spendingSubcategoryObject[0].updatedAt,
    });
  }

  async add(spendingSubcategory) {
    await this.tx.insert(spendingSubcategoryTable).values(spendingSubcategory);
  }

  async update(spendingSubcategory) {
    await this.tx
      .update(spendingSubcategoryTable)
      .set(spendingSubcategory)
      .where(
        and(
          eq(spendingSubcategoryTable.tenantId, spendingSubcategory.tenantId),
          eq(
            spendingSubcategoryTable.spendingSubcategoryId,
            spendingSubcategory.spendingSubcategoryId
          )
        )
      );
  }

  async remove(spendingSubcategory) {
    await this.tx
      .delete(spendingSubcategoryTable)
      .where(
        and(
          eq(spendingSubcategoryTable.tenantId, spendingSubcategory.tenantId),
          eq(
            spendingSubcategoryTable.spendingSubcategoryId,
            spendingSubcategory.spendingSubcategoryId
          )
        )
      );
  }
}

export { SpendingSubcategoryRepository };
