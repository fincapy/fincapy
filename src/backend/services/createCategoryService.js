import { Category } from '@/backend/domain/category';

class CreateCategoryService {
  constructor({ categoryRepositoryFactory, db }) {
    this.categoryRepositoryFactory = categoryRepositoryFactory;
    this.db = db;
  }

  async execute({
    tenantId,
    categoryId,
    name,
    monthlySpendingGoal,
    yearlySpendGoal,
  }) {
    await this.db.transaction(async (tx) => {
      const categoryRepository = new this.categoryRepositoryFactory({ tx });
      const existingCategory = await categoryRepository.get({
        tenantId,
        categoryId,
      });
      if (existingCategory) {
        throw new Error('Category already exists');
      }
      const category = new Category({
        tenantId,
        categoryId,
        name,
        monthlySpendingGoal,
        yearlySpendGoal,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await categoryRepository.add(category);
    });
  }
}

export { CreateCategoryService };
