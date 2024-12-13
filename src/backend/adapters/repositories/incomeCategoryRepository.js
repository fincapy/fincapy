import { incomeCategoryTable } from '../orm';
import { eq, and } from 'drizzle-orm';
import { IncomeCategory } from '@/backend/domain/incomeCategory';

class IncomeCategoryRepository {
  constructor({ tx }) {
    this.tx = tx;
  }

  async get({ tenantId, incomeCategoryId }) {
    const incomeCategoryObject = await this.tx
      .select()
      .from(incomeCategoryTable)
      .where(
        and(
          eq(incomeCategoryTable.tenantId, tenantId),
          eq(incomeCategoryTable.incomeCategoryId, incomeCategoryId)
        )
      );

    if (incomeCategoryObject.length === 0) {
      return null;
    }

    return new IncomeCategory({
      tenantId: incomeCategoryObject[0].tenantId,
      incomeCategoryId: incomeCategoryObject[0].incomeCategoryId,
      name: incomeCategoryObject[0].name,
      monthlyIncomeGoal: incomeCategoryObject[0].monthlyIncomeGoal,
      createdAt: incomeCategoryObject[0].createdAt,
      updatedAt: incomeCategoryObject[0].updatedAt,
      isImmutable: incomeCategoryObject[0].isImmutable,
    });
  }

  async add(incomeCategory) {
    await this.tx.insert(incomeCategoryTable).values({ ...incomeCategory });
  }

  async update(incomeCategory) {
    await this.tx
      .update(incomeCategoryTable)
      .set({ ...incomeCategory })
      .where(
        and(
          eq(incomeCategoryTable.tenantId, incomeCategory.tenantId),
          eq(
            incomeCategoryTable.incomeCategoryId,
            incomeCategory.incomeCategoryId
          )
        )
      );
  }

  async remove(incomeCategory) {
    await this.tx
      .delete(incomeCategoryTable)
      .where(
        and(
          eq(incomeCategoryTable.tenantId, incomeCategory.tenantId),
          eq(
            incomeCategoryTable.incomeCategoryId,
            incomeCategory.incomeCategoryId
          )
        )
      );
  }
}

export { IncomeCategoryRepository };
