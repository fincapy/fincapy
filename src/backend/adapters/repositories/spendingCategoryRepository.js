import { spendingCategoryTable } from '../orm';
import { eq, and } from 'drizzle-orm';
import { SpendingCategory } from '@/backend/domain/spendingCategory';

class SpendingCategoryRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, spendingCategoryId }) {
    const spendingCategoryObject = await this.tx
      .select()
      .from(spendingCategoryTable)
      .where(
        and(
          eq(spendingCategoryTable.tenantId, tenantId),
          eq(spendingCategoryTable.spendingCategoryId, spendingCategoryId)
        )
      );

    if (spendingCategoryObject.length === 0) {
      return null;
    }

    return new SpendingCategory({
      tenantId: spendingCategoryObject[0].tenantId,
      spendingCategoryId: spendingCategoryObject[0].spendingCategoryId,
      name: spendingCategoryObject[0].name,
      monthlySpendGoal: spendingCategoryObject[0].monthlySpendGoal,
      yearlySpendGoal: spendingCategoryObject[0].yearlySpendGoal,
      createdAt: spendingCategoryObject[0].createdAt,
      updatedAt: spendingCategoryObject[0].updatedAt,
      isImmutable: spendingCategoryObject[0].isImmutable,
    });
  }

  async add(spendingCategory) {
    await this.tx.insert(spendingCategoryTable).values({ ...spendingCategory });
  }

  async update(spendingCategory) {
    await this.tx
      .update(spendingCategoryTable)
      .set({ ...spendingCategory })
      .where(
        and(
          eq(spendingCategoryTable.tenantId, spendingCategory.tenantId),
          eq(
            spendingCategoryTable.spendingCategoryId,
            spendingCategory.spendingCategoryId
          )
        )
      );
  }

  async remove(spendingCategory) {
    await this.tx
      .delete(spendingCategoryTable)
      .where(
        and(
          eq(spendingCategoryTable.tenantId, spendingCategory.tenantId),
          eq(
            spendingCategoryTable.spendingCategoryId,
            spendingCategory.spendingCategoryId
          )
        )
      );
  }
}

export { SpendingCategoryRepository };
