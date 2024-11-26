class DeleteSpendingSubcategoryService {
  constructor(spendingSubcategoryRepositoryFactory, db) {
    this.spendingSubcategoryRepositoryFactory =
      spendingSubcategoryRepositoryFactory;
    this.db = db;
  }
  async execute({ tenantId, spendingSubcategoryId }) {
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
      if (!existingSpendingSubcategory) {
        throw new Error('SpendingSubcategory not found');
      }
      await spendingSubcategoryRepository.remove(existingSpendingSubcategory);
    });
  }
}

export { DeleteSpendingSubcategoryService };
