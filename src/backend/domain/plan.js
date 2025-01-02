class Plan {
  constructor({ planId, categories }) {
    this.planId = planId;
    this.categories = categories;
    this.startDate = null;
    this.endDate = null;
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

  prorateMonthlyGoals() {
    this.categories.forEach((category) => {
      const fractionOfMonths = this.getFractionOfMonths();
      const unroundedGoal = fractionOfMonths * category.monthlyGoal;
      category.proratedGoal = Math.round(unroundedGoal * 100) / 100;
      category.subcategories.forEach((subcategory) => {
        const unroundedGoal = fractionOfMonths * subcategory.monthlyGoal;
        subcategory.proratedGoal = Math.round(unroundedGoal * 100) / 100;
      });
    });
  }
}

export { Plan };
