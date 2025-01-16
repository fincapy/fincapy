'use client';

import { PageContext } from '@/components/dashboard-layout/pageContext';
import { useContext } from 'react';
import CategoryDashboard from '@/components/category-dashboard';
import FinancialInstitutionsDashboard from '@/components/financial-institutions-dashboard';
import Dashboard from '@/components/users-dashboard';
import {
  spendingViewAtom,
  incomeViewAtom,
  savingsViewAtom,
} from '@/components/state/atoms';
import { useAtomValue } from 'jotai';
import { useEffect } from 'react';

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
  useEffect(() => {
    const preventPullToRefresh = (e) => {
      if (window.scrollY === 0) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventPullToRefresh, {
      passive: false,
    });

    return () => {
      document.removeEventListener('touchmove', preventPullToRefresh);
    };
  }, []);

  const { page } = useContext(PageContext);
  if (page === 'spending') {
    return <SpendingCategoryDashboard />;
  } else if (page === 'income') {
    return <IncomeCategoryDashboard />;
  } else if (page === 'savings') {
    return <SavingsCategoryDashboard />;
  } else if (page === 'financial-institutions') {
    return <FinancialInstitutionsDashboard />;
  } else if (page === 'manage-users') {
    return <Dashboard />;
  }
}
