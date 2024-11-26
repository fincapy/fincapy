import { SpendingSubcategory } from '../domain/spendingSubcategory';

class CreateSpendingSubcategoryService {
  constructor(spendingSubcategoryRepositoryFactory, db) {
    this.spendingSubcategoryRepositoryFactory =
      spendingSubcategoryRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId, spendingSubcategoryId, spendingCategoryId, name }) {
    await this.db.transaction(async (tx) => {
      const spendingSubcategoryRepository =
        new this.spendingSubcategoryRepositoryFactory({
          tx,
        });
      const existingSpendingSubcategory =
        await spendingSubcategoryRepository.get({
          tenantId,
          spendingSubcategoryId,
        });
      if (existingSpendingSubcategory) {
        throw new Error('Subcategory already exists');
      }
      const spendingSubcategory = new SpendingSubcategory({
        tenantId,
        spendingSubcategoryId,
        spendingCategoryId,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await spendingSubcategoryRepository.add(spendingSubcategory);
    });
  }
}

export { CreateSpendingSubcategoryService };
