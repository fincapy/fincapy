class DeleteSpendingCategoryService {
  constructor({ spendingCategoryRepositoryFactory, db }) {
    this.spendingCategoryRepositoryFactory = spendingCategoryRepositoryFactory;
    this.db = db;
  }

  async execute({ tenantId, spendingCategoryId }) {
    await this.db.transaction(async (tx) => {
      const spendingCategoryRepository =
        new this.spendingCategoryRepositoryFactory({ tx });
      const existingSpendingCategory = await spendingCategoryRepository.get({
        tenantId,
        spendingCategoryId,
      });
      if (!existingSpendingCategory) {
        throw new Error('SpendingCategory not found');
      }
      await spendingCategoryRepository.remove(existingSpendingCategory);
    });
  }
}

export { DeleteSpendingCategoryService };
