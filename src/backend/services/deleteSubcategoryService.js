class DeleteSubcategoryService {
  constructor({ subcategoryRepositoryFactory, db }) {
    this.subcategoryRepositoryFactory = subcategoryRepositoryFactory;
    this.db = db;
  }
  async execute({ tenantId, subcategoryId }) {
    await this.db.transaction(async (tx) => {
      const subcategoryRepository = new this.subcategoryRepositoryFactory({
        tx,
      });
      const existingSubcategory = await subcategoryRepository.get({
        tenantId,
        subcategoryId,
      });
      if (!existingSubcategory) {
        throw new Error('Subcategory not found');
      }
      await subcategoryRepository.remove(existingSubcategory);
    });
  }
}

export { DeleteSubcategoryService };
