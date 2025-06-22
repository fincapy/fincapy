'use client';

import { PageContext } from '@/components/dashboard-layout/pageContext';
import {
  useContext,
  useMemo,
  useEffect,
  useState,
  useRef,
  useTransition,
} from 'react';
import CategoryDashboard from '@/components/category-dashboard';
import FinancialInstitutionsDashboard from '@/components/financial-institutions-dashboard';
import Dashboard from '@/components/users-dashboard';
import {
  spendingViewAtom,
  incomeViewAtom,
  savingsViewAtom,
  tabLoadingAtom,
  tabLoadingTimerAtom,
} from '@/components/state/atoms';
import { useAtomValue, useAtom } from 'jotai';
import { TransactionsDashboard } from '@/components/transactions-dashboard';
import { AccountPage } from '@/components/account-dashboard';
import {
  SpendingSkeleton,
  IncomeSkeleton,
  SavingsSkeleton,
  TransactionsSkeleton,
  FinancialInstitutionsSkeleton,
  ManageUsersSkeleton,
  AccountSkeleton,
  TestSkeleton,
} from '@/components/ui/page-skeletons';

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

// Main component for the application's dashboard.
export default function Home({ searchParams }) {
  const { page } = useContext(PageContext);
  const [tabLoading, setTabLoading] = useAtom(tabLoadingAtom);
  const [tabLoadingTimer, setTabLoadingTimer] = useAtom(tabLoadingTimerAtom);
  const [currentPage, setCurrentPage] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [deferredPage, setDeferredPage] = useState(null);
  const [isPending, startTransition] = useTransition();
  const pageChangeTimeRef = useRef(null);

  // Initialize currentPage on first render
  useEffect(() => {
    if (currentPage === null) {
      setCurrentPage(page);
      setDeferredPage(page);
    }
  }, [page, currentPage]);

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

  const skeletonComponents = useMemo(
    () => ({
      spending: <SpendingSkeleton />,
      income: <IncomeSkeleton />,
      savings: <SavingsSkeleton />,
      transactions: <TransactionsSkeleton />,
      'financial-institutions': <FinancialInstitutionsSkeleton />,
      'manage-users': <ManageUsersSkeleton />,
      account: <AccountSkeleton />,
    }),
    []
  );

  // Handle tab switching with immediate skeleton display
  useEffect(() => {
    if (page !== currentPage && currentPage !== null) {
      // Clear any existing timer
      if (tabLoadingTimer) {
        clearTimeout(tabLoadingTimer);
        setTabLoadingTimer(null);
      }

      // Record when the page change started
      const startTime = Date.now();
      pageChangeTimeRef.current = startTime;

      // Immediately show skeleton and switch to new page visually
      setShowSkeleton(true);
      setTabLoading(true);
      setCurrentPage(page);

      // Use startTransition to defer the heavy rendering work
      startTransition(() => {
        setDeferredPage(page);
      });

      // Always wait exactly 200ms before hiding skeleton
      const timer = setTimeout(() => {
        setShowSkeleton(false);
        setTabLoading(false);
        setTabLoadingTimer(null);
      }, 200);

      setTabLoadingTimer(timer);
    }
  }, [page, currentPage, tabLoadingTimer, setTabLoading, setTabLoadingTimer]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (tabLoadingTimer) {
        clearTimeout(tabLoadingTimer);
      }
    };
  }, [tabLoadingTimer]);

  const tabs = [
    'spending',
    'income',
    'savings',
    'transactions',
    'financial-institutions',
    'manage-users',
    'account',
  ];

  // Don't render anything until currentPage is initialized
  if (currentPage === null) {
    return <div className="w-full h-full"></div>;
  }

  return (
    <div className="w-full h-full">
      {tabs.map((tabKey) => {
        const isCurrentTab = currentPage === tabKey;
        const shouldShowSkeleton = showSkeleton && isCurrentTab;

        return (
          <div
            key={tabKey}
            className={`w-full h-full transition-opacity duration-75 bg-[linear-gradient(to_bottom,theme(colors.emerald.700)_30px,theme(colors.gray.200)_30px)] ${
              isCurrentTab ? 'block' : 'hidden'
            }`}
          >
            {shouldShowSkeleton
              ? skeletonComponents[tabKey]
              : deferredPage === tabKey
                ? components[tabKey]
                : null}
          </div>
        );
      })}
    </div>
  );
}
