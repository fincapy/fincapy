class UpdateCategoryService {
  constructor({ categoryRepositoryFactory, db }) {
    this.categoryRepositoryFactory = categoryRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId, categoryId, name, monthlyGoal }) {
    await this.db.transaction(async (tx) => {
      const categoryRepository = new this.categoryRepositoryFactory({ tx });
      const existingCategory = await categoryRepository.get({
        tenantId,
        categoryId,
      });
      if (!existingCategory) {
        throw new Error('Category not found');
      }
      existingCategory.name = name;
      existingCategory.monthlyGoal = monthlyGoal;
      existingCategory.updatedAt = new Date();
      await categoryRepository.update(existingCategory);
    });
  }
}

export { UpdateCategoryService };
