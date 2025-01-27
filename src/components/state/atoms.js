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

export const plaidItemsAtom = atom([]);

export const usersAtom = atom(null);
