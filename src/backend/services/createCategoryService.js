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
    monthlyGoal,
    type,
    isImmutable,
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
        type,
        name,
        monthlyGoal,
        createdAt: new Date(),
        updatedAt: new Date(),
        isImmutable,
      });
      await categoryRepository.add(category);
    });
  }
}

export { CreateCategoryService };
