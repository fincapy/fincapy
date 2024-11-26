import { SpendingCategory } from '../domain/spendingCategory';
import { SpendingSubcategory } from '../domain/spendingSubcategory';

class SetupNewTenantService {
  constructor({
    spendingCategoryRepositoryFactory,
    spendingSubcategoryRepositoryFactory,
    db,
  }) {
    this.spendingCategoryRepositoryFactory = spendingCategoryRepositoryFactory;
    this.spendingSubcategoryRepositoryFactory =
      spendingSubcategoryRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId }) {
    await this.db.transaction(async (tx) => {
      const spendingCategoryRepository =
        new this.spendingCategoryRepositoryFactory({ tx });
      const spendingSubcategoryRepository =
        new this.spendingSubcategoryRepositoryFactory({
          tx,
        });
      const uncategorizedSpendingCategory = new SpendingCategory({
        tenantId,
        categoryId: crypto.randomUUID(),
        name: 'Uncategorized',
        monthlySpendGoal: 0,
        yearlySpendGoal: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isImmutable: true,
      });
      await spendingCategoryRepository.add(uncategorizedSpendingCategory);

      const spendingSubcategory = new SpendingSubcategory({
        tenantId,
        spendingSubcategoryId: crypto.randomUUID(),
        spendingCategoryId: uncategorizedSpendingCategory.spendingCategoryId,
        name: 'General',
        monthlySpendGoal: 0,
        yearlySpendGoal: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isImmutable: true,
      });
      await spendingSubcategoryRepository.add(spendingSubcategory);
    });
  }
}

export { SetupNewTenantService };
