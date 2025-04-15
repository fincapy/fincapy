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
  categoryNames.push({
    id: null,
    name: 'None',
  });

  plan.categories.forEach((category) => {
    if (category.categoryId.includes('other') && category.type !== 'savings') {
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

export const usersAtom = atom([]);

export const isLoadingAtom = atom(true);

export const plaidItemDisplayNamesAtom = atom((get) => {
  const plaidItems = get(plaidItemsAtom);
  const users = get(usersAtom);
  const plaidItemIdToName = {};
  plaidItems.forEach((plaidItem) => {
    const user = users.find((user) => user.id === plaidItem.userId);
    if (user) {
      plaidItemIdToName[plaidItem.plaidItemId] =
        plaidItem.institutionName + ' - ' + user.name;
    } else {
      plaidItemIdToName[plaidItem.plaidItemId] = plaidItem.institutionName;
    }
  });
  return plaidItemIdToName;
});

export const currentUserIdAtom = atom(null);

export const currentUserAtom = atom(null);

export const currentUserRoleAtom = atom(null);

export const nonceAtom = atom(null);
