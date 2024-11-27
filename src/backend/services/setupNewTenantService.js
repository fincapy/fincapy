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

  async execute({ tenantId, spendingCategoryId, spendingSubcategoryId }) {
    await this.db.transaction(async (tx) => {
      const spendingCategoryRepository =
        new this.spendingCategoryRepositoryFactory({ tx });
      const spendingSubcategoryRepository =
        new this.spendingSubcategoryRepositoryFactory({
          tx,
        });

      const existingSpendingCategory = await spendingCategoryRepository.get({
        tenantId,
        spendingCategoryId,
      });
      if (existingSpendingCategory) {
        throw new Error('SpendingCategory already exists');
      }
      const uncategorizedSpendingCategory = new SpendingCategory({
        tenantId,
        spendingCategoryId: spendingCategoryId,
        name: 'Uncategorized',
        monthlySpendGoal: 0,
        yearlySpendGoal: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isImmutable: true,
      });
      console.log(uncategorizedSpendingCategory);
      await spendingCategoryRepository.add(uncategorizedSpendingCategory);

      const existingSpendingSubcategory =
        await spendingSubcategoryRepository.get({
          tenantId,
          spendingSubcategoryId,
        });
      if (existingSpendingSubcategory) {
        throw new Error('SpendingSubcategory already exists');
      }
      const spendingSubcategory = new SpendingSubcategory({
        tenantId,
        spendingSubcategoryId: spendingSubcategoryId,
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
