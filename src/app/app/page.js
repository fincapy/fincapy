'use client';

import { redirect } from 'next/navigation';
import { PageContext } from '@/components/dashboard-layout/pageContext';
import { useContext } from 'react';
import CategoryDashboard from '@/components/category-dashboard';
import FinancialInstitutionsDashboard from '@/components/financial-institutions-dashboard';
import Dashboard from '@/components/users-dashboard';

const SpendingCategoryDashboard = () => {
  return <CategoryDashboard type="spending" />;
};

const IncomeCategoryDashboard = () => {
  return <CategoryDashboard type="income" />;
};

const SavingsCategoryDashboard = () => {
  return <CategoryDashboard type="savings" />;
};

export default function Home({ searchParams }) {
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
