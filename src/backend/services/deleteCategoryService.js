class DeleteCategoryService {
  constructor({ categoryRepositoryFactory, db }) {
    this.categoryRepositoryFactory = categoryRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId, categoryId }) {
    await this.db.transaction(async (tx) => {
      const categoryRepository = new this.categoryRepositoryFactory({ tx });
      const existingCategory = await categoryRepository.get({
        tenantId,
        categoryId,
      });
      if (!existingCategory) {
        throw new Error('Category not found');
      }
      await categoryRepository.remove(existingCategory);
    });
  }
}

export { DeleteCategoryService };
