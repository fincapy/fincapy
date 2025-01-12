import { Recategorization } from '../domain/recategorization';

class RecategorizeTransactionService {
  constructor({ tenantRepository }) {
    this.tenantRepository = tenantRepository;
  }

  async execute({ tenantId, transactionId, planId, newCategoryId }) {
    const tenant = await this.tenantRepository.getWithTransaction({ tenantId });
    if (tenant === null) {
      return;
    }
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    let transaction;
    let oldCategoryName;
    let newCategoryName;
    plan.categories.forEach((category) => {
      category.transactions.forEach((t) => {
        if (t.transactionId === transactionId) {
          transaction = t;
          oldCategoryName = category.name;
        }
      });
      category.subcategories.forEach((subcategory) => {
        subcategory.transactions.forEach((t) => {
          if (t.transactionId === transactionId) {
            transaction = t;
            oldCategoryName = category.name + ' - ' + subcategory.name;
          }
        });
      });
    });
    plan.categories.forEach((category) => {
      category.transactions = category.transactions.filter(
        (t) => t.transactionId !== transactionId
      );
      category.subcategories.forEach((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (t) => t.transactionId !== transactionId
        );
      });
    });
    plan.categories.forEach((category) => {
      if (category.categoryId === newCategoryId) {
        category.transactions.push(transaction);
        newCategoryName = category.name;
      }
      category.subcategories.forEach((subcategory) => {
        if (subcategory.subcategoryId === newCategoryId) {
          subcategory.transactions.push(transaction);
          newCategoryName = category.name + ' - ' + subcategory.name;
        }
      });
    });
    const recategorization = new Recategorization({
      transactionDescription: transaction.description,
      oldCategoryName: oldCategoryName,
      newCategoryName: newCategoryName,
      createdAt: new Date(),
    });
    plan.recategorizations.push(recategorization);
    await this.tenantRepository.set({ tenantId, tenant });
  }
}

export { RecategorizeTransactionService };
