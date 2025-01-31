import { atom } from 'jotai';

export const planAtom = atom(null);
export const spendingViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toSpendingView()] : [];
});

export const incomeViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toIncomeView()] : [];
});

export const savingsViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toSavingsView()] : [];
});

export const transactionsViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toTransactionsView()] : [];
});

export const categoryNamesAtom = atom((get) => {
  const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const plan = get(planAtom);
  if (!plan) {
    return [];
  }

  let categoryNames = [];

  plan.categories.forEach((category) => {
    if (category.type !== 'savings') {
      categoryNames.push({
        id: category.categoryId,
        name: `${capitalize(category.type)} - ${category.name}`,
      });
    }
    category.subcategories.forEach((subcategory) => {
      categoryNames.push({
        id: subcategory.subcategoryId,
        name: `${capitalize(category.type)} - ${category.name} - ${subcategory.name}`,
      });
    });
  });

  return categoryNames;
});

export const plaidItemsAtom = atom([]);

export const usersAtom = atom(null);

export const isLoadingAtom = atom(true);
