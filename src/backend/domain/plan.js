class Plan {
  constructor({ planId, categories, recategorizations }) {
    this.planId = planId;
    this.categories = categories;
    this.startDate = null;
    this.endDate = null;
    this.recategorizations = recategorizations;
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
    categories.sort((a, b) => a.spendingPagePosition - b.spendingPagePosition);
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
