import { SpendingCategory } from '@/backend/domain/spendingSpendingCategory';

export class CreateSpendingCategoryService {
  constructor({ spendingCategoryRepositoryFactory, db }) {
    this.spendingCategoryRepositoryFactory = spendingCategoryRepositoryFactory;
    this.db = db;
  }

  async execute({
    tenantId,
    spendingCategoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
  }) {
    await this.db.transaction(async (tx) => {
      const spendingCategoryRepository =
        new this.spendingCategoryRepositoryFactory({ tx });
      const existingSpendingCategory = await spendingCategoryRepository.get({
        tenantId,
        spendingCategoryId,
      });
      if (existingSpendingCategory) {
        throw new Error('SpendingCategory already exists');
      }
      const spendingCategory = new SpendingCategory({
        tenantId,
        spendingCategoryId,
        name,
        monthlySpendGoal,
        yearlySpendGoal,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await spendingCategoryRepository.add(spendingCategory);
    });
  }
}

export { CreateSpendingCategoryService };
