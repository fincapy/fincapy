import { Subcategory } from '../domain/subcategory';

class CreateSubcategoryService {
  constructor({ subcategoryRepositoryFactory, db }) {
    this.subcategoryRepositoryFactory = subcategoryRepositoryFactory;
    this.db = db;
  }

  async execute({
    tenantId,
    subcategoryId,
    categoryId,
    name,
    monthlySpendingGoal,
  }) {
    await this.db.transaction(async (tx) => {
      const subcategoryRepository = new this.subcategoryRepositoryFactory({
        tx,
      });
      const existingSubcategory = await subcategoryRepository.get({
        tenantId,
        subcategoryId,
      });
      if (existingSubcategory) {
        throw new Error('Subcategory already exists');
      }
      const subcategory = new Subcategory({
        tenantId,
        subcategoryId,
        categoryId,
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
        monthlySpendingGoal,
      });
      await subcategoryRepository.add(subcategory);
    });
  }
}

export { CreateSubcategoryService };
