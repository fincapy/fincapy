'use client';

import { PageContext } from '@/components/dashboard-layout/pageContext';
import { useContext, useMemo } from 'react';
import CategoryDashboard from '@/components/category-dashboard';
import FinancialInstitutionsDashboard from '@/components/financial-institutions-dashboard';
import Dashboard from '@/components/users-dashboard';
import {
  spendingViewAtom,
  incomeViewAtom,
  savingsViewAtom,
} from '@/components/state/atoms';
import { useAtomValue } from 'jotai';
import { TransactionsDashboard } from '@/components/transactions-dashboard';
import { AccountPage } from '@/components/account-dashboard';

const SpendingCategoryDashboard = () => {
  const spendingView = useAtomValue(spendingViewAtom);
  return <CategoryDashboard type="spending" categories={spendingView} />;
};

const IncomeCategoryDashboard = () => {
  const incomeView = useAtomValue(incomeViewAtom);
  return <CategoryDashboard type="income" categories={incomeView} />;
};

const SavingsCategoryDashboard = () => {
  const savingsView = useAtomValue(savingsViewAtom);
  return <CategoryDashboard type="savings" categories={savingsView} />;
};

export default function Home({ searchParams }) {
  const { page } = useContext(PageContext);

  // Memoize components to prevent unnecessary re-renders
  const components = useMemo(
    () => ({
      spending: <SpendingCategoryDashboard />,
      income: <IncomeCategoryDashboard />,
      savings: <SavingsCategoryDashboard />,
      transactions: <TransactionsDashboard />,
      'financial-institutions': <FinancialInstitutionsDashboard />,
      'manage-users': <Dashboard />,
      account: <AccountPage />,
    }),
    []
  );

  const tabs = [
    'spending',
    'income',
    'savings',
    'transactions',
    'financial-institutions',
    'manage-users',
    'account',
  ];

  return (
    <div className="w-full h-full">
      {tabs.map((tabKey) => (
        <div
          key={tabKey}
          className={`w-full h-full transition-opacity duration-75 ${
            page === tabKey ? 'block' : 'hidden'
          }`}
        >
          {components[tabKey]}
        </div>
      ))}
    </div>
  );
}
