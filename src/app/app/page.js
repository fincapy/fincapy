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
import { useState, useMemo } from 'react';

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

const usePullRefreshDetection = () => {
  var pStart = { x: 0, y: 0 };
  var pStop = { x: 0, y: 0 };

  function swipeStart(e) {
    if (typeof e['targetTouches'] !== 'undefined') {
      var touch = e.targetTouches[0];
      pStart.x = touch.screenX;
      pStart.y = touch.screenY;
    } else {
      pStart.x = e.screenX;
      pStart.y = e.screenY;
    }
  }

  function swipeEnd(e) {
    if (typeof e['changedTouches'] !== 'undefined') {
      var touch = e.changedTouches[0];
      pStop.x = touch.screenX;
      pStop.y = touch.screenY;
    } else {
      pStop.x = e.screenX;
      pStop.y = e.screenY;
    }

    swipeCheck();
  }

  function swipeCheck() {
    var changeY = pStart.y - pStop.y;
    var changeX = pStart.x - pStop.x;
    if (isPullDown(changeY, changeX)) {
      alert('Swipe Down!');
    }
  }

  function isPullDown(dY, dX) {
    // methods of checking slope, length, direction of line created by swipe action
    return (
      dY < 0 &&
      ((Math.abs(dX) <= 100 && Math.abs(dY) >= 300) ||
        (Math.abs(dX) / Math.abs(dY) <= 0.3 && dY >= 60))
    );
  }

  document.addEventListener(
    'touchstart',
    function (e) {
      swipeStart(e);
    },
    false
  );
  document.addEventListener(
    'touchend',
    function (e) {
      swipeEnd(e);
    },
    false
  );
};

export default function Home({ searchParams }) {
  const [pStart, setPStart] = useState({ x: 0, y: 0 });
  const [pStop, setPStop] = useState({ x: 0, y: 0 });

  // useEffect(() => {
  //   function isPullDown(dY, dX) {
  //     // methods of checking slope, length, direction of line created by swipe action
  //     return (
  //       dY < 0 &&
  //       ((Math.abs(dX) <= 100 && Math.abs(dY) >= 300) ||
  //         (Math.abs(dX) / Math.abs(dY) <= 0.3 && dY >= 60))
  //     );
  //   }

  //   function swipeStart(e) {
  //     if (typeof e['targetTouches'] !== 'undefined') {
  //       const touch = e.targetTouches[0];
  //       setPStart({ x: touch.screenX, y: touch.screenY });
  //     } else {
  //       setPStart({ x: e.screenX, y: e.screenY });
  //     }
  //   }

  //   function swipeEnd(e) {
  //     if (typeof e['changedTouches'] !== 'undefined') {
  //       const touch = e.changedTouches[0];
  //       setPStop({ x: touch.screenX, y: touch.screenY });
  //     } else {
  //       setPStop({ x: e.screenX, y: e.screenY });
  //     }

  //     swipeCheck();
  //   }

  //   function swipeCheck() {
  //     const changeY = pStart.y - pStop.y;
  //     const changeX = pStart.x - pStop.x;
  //     if (isPullDown(changeY, changeX)) {
  //       alert('Swipe Down!');
  //     }
  //   }

  //   document.addEventListener('touchstart', swipeStart, false);
  //   document.addEventListener('touchend', swipeEnd, false);

  //   return () => {
  //     document.removeEventListener('touchstart', swipeStart, false);
  //     document.removeEventListener('touchend', swipeEnd, false);
  //   };
  // }, []);

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
