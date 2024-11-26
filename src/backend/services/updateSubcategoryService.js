class UpdateSpendingSubcategoryService {
  constructor({ spendingSubcategoryRepositoryFactory, db }) {
    this.spendingSubcategoryRepositoryFactory =
      spendingSubcategoryRepositoryFactory;
    this.db = db;
  }

  async execute({
    tenantId,
    spendingSubcategoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
  }) {
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
      existingSpendingSubcategory.name = name;
      existingSpendingSubcategory.monthlySpendGoal = monthlySpendGoal;
      existingSpendingSubcategory.yearlySpendGoal = yearlySpendGoal;
      existingSpendingSubcategory.updatedAt = new Date();
      await spendingSubcategoryRepository.update(existingSpendingSubcategory);
    });
  }
}

export { UpdateSpendingSubcategoryService };
