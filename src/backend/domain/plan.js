import { Category } from './category';
class Plan {
  constructor({ planId, categories, recategorizations, startDate, endDate }) {
    this.planId = planId;
    this.categories = categories;
    this.startDate = startDate;
    this.endDate = endDate;
    this.recategorizations = recategorizations;
  }

  clone() {
    return new Plan({
      ...this,
      categories: this.categories.map((category) => category.clone()),
    });
  }

  addCategory({ categoryId, name, monthlyGoal, type, isImmutable }) {
    if (
      this.categories.find((category) => category.categoryId === categoryId)
    ) {
      throw new Error('Category already exists');
    }
    const category = new Category({
      categoryId,
      type,
      name,
      monthlyGoal,
      isImmutable,
      transactions: [],
      subcategories: [],
      rank: 100000,
    });
    this.categories.push(category);
  }

  toView() {
    const planView = { ...this };
    planView.categories = planView.categories.map((category) => {
      category.transactions = category.transactions.filter((transaction) => {
        return (
          parse(transaction.date, 'yyyy-MM-dd', new Date()) >=
            planView.startDate &&
          parse(transaction.date, 'yyyy-MM-dd', new Date()) <= planView.endDate
        );
      });
      category.subcategories = category.subcategories.map((subcategory) => {
        subcategory.transactions = subcategory.transactions.filter(
          (transaction) => {
            return (
              parse(transaction.date, 'yyyy-MM-dd', new Date()) >=
                planView.startDate &&
              parse(transaction.date, 'yyyy-MM-dd', new Date()) <=
                planView.endDate
            );
          }
        );
        return { ...subcategory };
      });
      return { ...category };
    });
    return planView;
  }

  toSpendingView() {
    let categories = [];
    const fractionOfMonths = this.getFractionOfMonths();
    this.categories.forEach((category) => {
      if (category.type === 'spending') {
        category.toSpendingView(this.startDate, this.endDate, fractionOfMonths);
        categories.push(Object.assign({}, category));
      }
    });
    categories.sort((a, b) => a.rank - b.rank);
    return categories;
  }

  toIncomeView() {
    let categories = [];
    const fractionOfMonths = this.getFractionOfMonths();
    this.categories.forEach((category) => {
      if (category.type === 'income') {
        category.toIncomeView(this.startDate, this.endDate, fractionOfMonths);
        categories.push(Object.assign({}, category));
      }
    });
    categories.sort((a, b) => a.rank - b.rank);
    return categories;
  }

  toSavingsView() {
    let categories = [];
    let net = 0;
    const fractionOfMonths = this.getFractionOfMonths();
    this.categories.forEach((category) => {
      if (category.type === 'spending') {
        category.toSpendingView(this.startDate, this.endDate, fractionOfMonths);
        net += category.currentNet;
      } else if (category.type === 'income') {
        category.toIncomeView(this.startDate, this.endDate, fractionOfMonths);
        net += category.currentNet;
      }
    });
    const savingsCategory = this.categories.find(
      (category) => category.type === 'savings'
    );
    savingsCategory.currentNet = net;
    savingsCategory.allocateToSubcategories();
    savingsCategory.toSavingsView();
    categories.push(Object.assign({}, savingsCategory));
    return categories;
  }

  calculateSavings() {
    let savings = 0;
    for (const category of this.categories) {
      if (category.type === 'spending') {
        savings -= category.getCurrentSpending();
      }

      if (category.type === 'income') {
        savings += category.getCurrentIncome();
      }
    }
    return savings;
  }

  setSavings() {
    this.categories.forEach((category) => {
      if (category.type === 'savings') {
        category.currentSavings = this.calculateSavings();
      }
    });
  }

  getFractionOfMonths() {
    let totalDaysInMonths = 0;

    let current = new Date(
      this.startDate.getFullYear(),
      this.startDate.getMonth(),
      1
    );
    while (current <= this.endDate) {
      const totalDaysInMonth = new Date(
        current.getFullYear(),
        current.getMonth() + 1,
        0
      );
      totalDaysInMonths += totalDaysInMonth.getDate();

      current.setMonth(current.getMonth() + 1);
    }

    const differenceInMilliseconds = this.endDate - this.startDate;
    const daysBetween =
      Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24)) + 1;

    const factor = daysBetween / totalDaysInMonths;

    const yearsDifference =
      this.endDate.getFullYear() - this.startDate.getFullYear();
    const monthsDifference =
      this.endDate.getMonth() - this.startDate.getMonth();
    const monthsBetween = yearsDifference * 12 + monthsDifference + 1;

    return factor * monthsBetween;
  }
}

export { Plan };
