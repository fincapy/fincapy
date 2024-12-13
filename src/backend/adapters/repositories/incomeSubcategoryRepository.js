import { incomeSubcategoryTable } from '../orm';
import { eq, and } from 'drizzle-orm';
import { IncomeSubcategory } from '@/backend/domain/incomeSubcategory';

class IncomeSubcategoryRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, incomeSubcategoryId }) {
    const incomeSubcategoryObject = await this.tx
      .select()
      .from(incomeSubcategoryTable)
      .where(
        and(
          eq(incomeSubcategoryTable.tenantId, tenantId),
          eq(incomeSubcategoryTable.incomeSubcategoryId, incomeSubcategoryId)
        )
      );

    if (incomeSubcategoryObject.length === 0) {
      return null;
    }

    return new IncomeSubcategory({
      tenantId: incomeSubcategoryObject[0].tenantId,
      incomeSubcategoryId: incomeSubcategoryObject[0].incomeSubcategoryId,
      incomeCategoryId: incomeSubcategoryObject[0].incomeCategoryId,
      name: incomeSubcategoryObject[0].name,
      monthlyIncomeGoal: incomeSubcategoryObject[0].monthlyIncomeGoal,
      createdAt: incomeSubcategoryObject[0].createdAt,
      updatedAt: incomeSubcategoryObject[0].updatedAt,
    });
  }

  async add(incomeSubcategory) {
    await this.tx
      .insert(incomeSubcategoryTable)
      .values({ ...incomeSubcategory });
  }

  async update(incomeSubcategory) {
    await this.tx
      .update(incomeSubcategoryTable)
      .set(incomeSubcategory)
      .where(
        and(
          eq(incomeSubcategoryTable.tenantId, incomeSubcategory.tenantId),
          eq(
            incomeSubcategoryTable.incomeSubcategoryId,
            incomeSubcategory.incomeSubcategoryId
          )
        )
      );
  }

  async remove(incomeSubcategory) {
    await this.tx
      .delete(incomeSubcategoryTable)
      .where(
        and(
          eq(incomeSubcategoryTable.tenantId, incomeSubcategory.tenantId),
          eq(
            incomeSubcategoryTable.incomeSubcategoryId,
            incomeSubcategory.incomeSubcategoryId
          )
        )
      );
  }
}

export { IncomeSubcategoryRepository };
