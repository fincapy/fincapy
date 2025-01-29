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
  const plan = get(planAtom);
  if (!plan) {
    return [];
  }

  let categoryNames = [];

  plan.categories.forEach((category) => {
    categoryNames.push({ id: category.categoryId, name: category.name });
    category.subcategories.forEach((subcategory) => {
      categoryNames.push({
        id: subcategory.subcategoryId,
        name: `${category.name} - ${subcategory.name}`,
      });
    });
  });

  return categoryNames;
});

export const plaidItemsAtom = atom([]);

export const usersAtom = atom(null);
