import { parse } from 'date-fns';

class CategoriesView {
  constructor(repository) {
    this.repository = repository;
  }

  async get({ tenantId, planId, startDate, endDate }) {
    const tenant = await this.repository.get({ tenantId });
    const plan = tenant.plans.find((plan) => plan.planId === planId);
    plan.startDate = startDate;
    plan.endDate = endDate;
    plan.categories.forEach((category) => {
      category.transactions = category.transactions.filter((transaction) => {
        return (
          parse(transaction.date, 'yyyy-MM-dd', new Date()) >= startDate &&
          parse(transaction.date, 'yyyy-MM-dd', new Date()) <= endDate
        );
      });

      category.subcategories.forEach((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (transaction) => {
            return (
              parse(transaction.date, 'yyyy-MM-dd', new Date()) >= startDate &&
              parse(transaction.date, 'yyyy-MM-dd', new Date()) <= endDate
            );
          }
        );
      });
    });
    plan.categories.forEach((category) => {
      category.setTransactionCategoryNames();
      category.subcategories.forEach((subcategory) => {
        subcategory.transactions.forEach((transaction) => {
          category.transactions.push(transaction);
        });
      });
    });
    plan.prorateMonthlyGoals();
    plan.setSavings();
    plan.categories.forEach((category) => {
      if (category.type === 'spending') {
        category.setCurrentSpending();
      } else if (category.type === 'income') {
        category.setCurrentIncome();
      }

      category.subcategories.forEach((subcategory) => {
        if (subcategory.type === 'spending') {
          subcategory.setCurrentSpending();
        } else if (subcategory.type === 'income') {
          subcategory.setCurrentIncome();
        }
      });
    });

    plan.categories = plan.categories.map((category) => {
      return Object.assign({}, category);
    });
    plan.categories.forEach((category) => {
      category.subcategories = category.subcategories.map((subcategory) => {
        return Object.assign({}, subcategory);
      });
    });
    plan.categories = plan.categories.filter((category) => {
      return category.type === 'spending' || category.type === 'savings';
    });
    return plan.categories;
  }
}

export { CategoriesView };
