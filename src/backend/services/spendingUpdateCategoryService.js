class UpdateSpendingCategoryService {
  constructor({ spendingCategoryRepositoryFactory, db }) {
    this.spendingCategoryRepositoryFactory = spendingCategoryRepositoryFactory;
    this.db = db;
  }

  async execute({
    tenantId,
    spendingCategoryId,
    name,
    monthlySpendGoal,
    yearlySpendGoal,
  }) {
    console.log('spending category id', spendingCategoryId);
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
      existingSpendingCategory.name = name;
      existingSpendingCategory.monthlySpendGoal = monthlySpendGoal;
      existingSpendingCategory.yearlySpendGoal = yearlySpendGoal;
      existingSpendingCategory.updatedAt = new Date();
      await spendingCategoryRepository.update(existingSpendingCategory);
    });
  }
}

export { UpdateSpendingCategoryService };
