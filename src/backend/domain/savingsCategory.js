import { Category } from './category';

class SavingsCategory extends Category {
  constructor({
    tenantId,
    categoryId,
    name,
    monthlyGoal,
    createdAt,
    updatedAt,
    type,
    isImmutable,
    transactions,
    subcategories,
  }) {
    this.tenantId = tenantId;
    this.categoryId = categoryId;
    this.name = name;
    this.monthlyGoal = monthlyGoal;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.type = type;
    this.isImmutable = isImmutable;
    this.transactions = transactions;
    this.subcategories = subcategories;
    this.currentSavings = 1000;
    this.proratedGoal = 0;
  }

  allocateSavings() {
    let allocatedSavings = this.currentSavings;
    this.subcategories.forEach((subcategory) => {
      subcategory.currentSavings = Math.min(
        this.currentSavings,
        subcategory.monthlyGoal
      );
      allocatedSavings -= subcategory.currentSavings;
    });
  }
}

export { SavingsCategory };
