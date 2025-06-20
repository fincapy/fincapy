import { atom } from 'jotai';

const planAtom = atom(null);
const spendingViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toSpendingView()] : [];
});

const incomeViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toIncomeView()] : [];
});

const savingsViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toSavingsView()] : [];
});

const transactionsViewAtom = atom((get) => {
  const plan = get(planAtom);
  return plan ? [...plan.toTransactionsView()] : [];
});

const categoryNamesAtom = atom((get) => {
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

const plaidItemsAtom = atom([]);

const usersAtom = atom([]);

const isLoadingAtom = atom(true);

const plaidItemDisplayNamesAtom = atom((get) => {
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

const currentUserIdAtom = atom(null);

const currentUserAtom = atom(null);

const currentUserRoleAtom = atom(null);

const nonceAtom = atom(null);

const billingStatusAtom = atom(null);

const tabLoadingAtom = atom(false);
const tabLoadingTimerAtom = atom(null);

const transactionSearchQueryAtom = atom('');

export {
  planAtom,
  spendingViewAtom,
  incomeViewAtom,
  savingsViewAtom,
  transactionsViewAtom,
  categoryNamesAtom,
  plaidItemsAtom,
  usersAtom,
  isLoadingAtom,
  plaidItemDisplayNamesAtom,
  currentUserIdAtom,
  currentUserAtom,
  currentUserRoleAtom,
  nonceAtom,
  billingStatusAtom,
  tabLoadingAtom,
  tabLoadingTimerAtom,
  transactionSearchQueryAtom,
};
