class UpdateSubcategoryService {
  constructor({ subcategoryRepositoryFactory, db }) {
    this.subcategoryRepositoryFactory = subcategoryRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId, subcategoryId, name, monthlySpendingGoal }) {
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
      existingSubcategory.name = name;
      existingSubcategory.monthlySpendingGoal = monthlySpendingGoal;
      existingSubcategory.updatedAt = new Date();
      await subcategoryRepository.update(existingSubcategory);
    });
  }
}

export { UpdateSubcategoryService };
