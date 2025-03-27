'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Fragment } from 'react';
import { ChatWidget } from '@/components/chat-widget';
import {
  ScrollAreaWithPulldown,
  ScrollBarWithPulldown,
} from '@/components/ui/scroll-area-with-pulldown';
import { PlanContext } from './planContext';
import { useState } from 'react';
import { Plan } from '@/backend/domain/plan';
import { Category } from '@/backend/domain/category';
import { Subcategory } from '@/backend/domain/subcategory';
import { StartDateContext, EndDateContext } from './datesContext';
import { UsersContext } from './usersContext';
import { PlaidItemsContext } from './plaidItemsContext';
import { PageContext } from './pageContext';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import {
  HandCoins,
  PiggyBank,
  Landmark,
  Users,
  UserRound,
  Table,
  CircleDollarSign,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { parse } from 'date-fns';
import {
  planAtom,
  plaidItemsAtom,
  usersAtom,
  currentUserIdAtom,
  currentUserRoleAtom,
  nonceAtom,
} from '../state/atoms';
import { useSetAtom } from 'jotai';
import { useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStandalone } from '@/hooks/use-standalone';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const AccountDropdown = ({
  accountDropdownOpen,
  setAccountDropdownOpen,
  userRole,
  setPage,
  page,
}) => {
  const setPageCookie = (page) => {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    document.cookie = `page=${page}; expires=${expires.toUTCString()}; path=/app`;
  };

  const changePage = (page) => {
    setPage(page);
    setPageCookie(page);
  };

  return (
    <DropdownMenu
      open={accountDropdownOpen}
      onOpenChange={setAccountDropdownOpen}
    >
      <DropdownMenuTrigger asChild>
        <button className="flex flex-col items-center gap-[0px] group outline-none">
          <UserRound
            size={20}
            className={
              accountDropdownOpen ||
              page === 'manage-users' ||
              page === 'financial-institutions'
                ? 'text-primary'
                : 'text-muted group-hover:text-primary'
            }
          />
          <span
            className={
              accountDropdownOpen ||
              page === 'manage-users' ||
              page === 'financial-institutions'
                ? 'text-[11.5px] font-bold text-primary'
                : 'text-[11.5px] font-bold text-muted group-hover:text-primary'
            }
          >
            Account
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-card"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {userRole === 'owner' && (
          <Fragment>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2 hover:bg-background"
                onClick={() => changePage('manage-users')}
              >
                <Users size={16} />
                Users
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2 hover:bg-background"
                onClick={() => changePage('financial-institutions')}
              >
                <Landmark size={16} />
                Financial Institutions
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2 hover:bg-background"
                onClick={() => changePage('financial-institutions')}
              >
                <a
                  className="w-full flex items-center content-center gap-2"
                  href="https://billing.stripe.com/p/login/test_7sI28i4mUcdG8Ok4gg"
                >
                  <CreditCard size={16} />
                  Billing
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </Fragment>
        )}
        <DropdownMenuItem className="cursor-pointer">
          <a
            className="w-full flex items-center content-center gap-2"
            href="/api/signout"
          >
            <LogOut size={16} />
            Sign out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const NavBar = ({
  page,
  setPage,
  userRole,
  accountDropdownOpen,
  setAccountDropdownOpen,
}) => {
  const setPageCookie = (page) => {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    document.cookie = `page=${page}; expires=${expires.toUTCString()}; path=/app`;
  };

  const changePage = (page) => {
    setPage(page);
    setPageCookie(page);
  };

  const isStandalone = useStandalone();

  return (
    <div
      className={`flex flex-col items-center justify-center bg-card z-20 w-full fixed bottom-0 m-0 touch-none h-[6%]`}
    >
      <Separator className="w-full h-[1px] bg-border" />
      <div className="flex flex-row justify-center items-center lg:w-[33.33%] md:w-[50%] w-11/12 h-full">
        <div className="flex flex-row justify-between items-center flex-1">
          <button
            onClick={() => changePage('spending')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <HandCoins
              size={20}
              className={
                page === 'spending'
                  ? 'text-primary'
                  : 'text-muted group-hover:text-primary'
              }
            />
            <span
              className={
                page === 'spending'
                  ? 'text-[11.5px] font-bold text-primary'
                  : 'text-[11.5px] font-bold text-muted group-hover:text-primary'
              }
            >
              Spending
            </span>
          </button>
          <button
            onClick={() => changePage('income')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <CircleDollarSign
              size={20}
              className={
                page === 'income'
                  ? 'text-primary'
                  : 'text-muted group-hover:text-primary'
              }
            />
            <span
              className={
                page === 'income'
                  ? 'text-[11.5px] font-bold text-primary'
                  : 'text-[11.5px] font-bold text-muted group-hover:text-primary'
              }
            >
              Income
            </span>
          </button>
          <button
            onClick={() => changePage('savings')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <PiggyBank
              size={20}
              className={
                page === 'savings'
                  ? 'text-primary'
                  : 'text-muted group-hover:text-primary'
              }
            />
            <span
              className={
                page === 'savings'
                  ? 'text-[11.5px] font-bold text-primary'
                  : 'text-[11.5px] font-bold text-muted group-hover:text-primary'
              }
            >
              Savings
            </span>
          </button>
          <button
            onClick={() => changePage('transactions')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <Table
              size={20}
              className={
                page === 'transactions'
                  ? 'text-primary'
                  : 'text-muted group-hover:text-primary'
              }
            />
            <span
              className={
                page === 'transactions'
                  ? 'text-[11.5px] font-bold text-primary'
                  : 'text-[11.5px] font-bold text-muted group-hover:text-primary'
              }
            >
              Transactions
            </span>
          </button>
          <AccountDropdown
            userRole={userRole}
            setPage={setPage}
            accountDropdownOpen={accountDropdownOpen}
            setAccountDropdownOpen={setAccountDropdownOpen}
            page={page}
          />
        </div>
      </div>
    </div>
  );
};

function toLocalISO(date) {
  const offsetMs = date.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
  const localTime = new Date(date - offsetMs);
  return localTime.toISOString().slice(0, 19); // Remove 'Z' to avoid UTC indication
}

export default function DashboardLayout({
  children,
  userEmail,
  userRole,
  plan,
  userId,
  users,
  plaidItems,
  pageParam,
  nonce,
}) {
  const firstRender = useRef(true);

  const newPlan = new Plan({
    ...plan,
    categories: plan.categories.map((category) => {
      return new Category({
        ...category,
        subcategories: category.subcategories.map((subcategory) => {
          return new Subcategory({ ...subcategory });
        }),
      });
    }),
  });
  // get starting date of current month
  const startDate = new Date();
  startDate.setDate(1);
  // get ending date of current month
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  newPlan.startDate = startDate;
  newPlan.endDate = endDate;

  const setPlanState = useSetAtom(planAtom);
  const setPlaidItemsState = useSetAtom(plaidItemsAtom);
  const setUsersState = useSetAtom(usersAtom);
  const [startDateState, setStartDateState] = useState(
    toLocalISO(startDate).split('T')[0]
  );
  const [endDateState, setEndDateState] = useState(
    toLocalISO(endDate).split('T')[0]
  );
  const setCurrentUserId = useSetAtom(currentUserIdAtom);
  const setCurrentUserRole = useSetAtom(currentUserRoleAtom);
  const [page, setPage] = useState(pageParam || 'spending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const previousDates = useRef({
    startDate: startDateState,
    endDate: endDateState,
  });
  const setNonce = useSetAtom(nonceAtom);

  useEffect(() => {
    const getPlan = async () => {
      const res = await fetch(
        `/api/plan?startDate=${startDateState}&endDate=${endDateState}&planId=initial`
      );
      const plan = await res.json();
      const newPlan = new Plan({
        ...plan,
        startDate: parse(startDateState, 'yyyy-MM-dd', new Date()),
        endDate: parse(endDateState, 'yyyy-MM-dd', new Date()),
        categories: plan.categories.map((category) => {
          return new Category({
            ...category,
            subcategories: category.subcategories.map((subcategory) => {
              return new Subcategory({ ...subcategory });
            }),
          });
        }),
      });
      setPlanState(newPlan);
    };

    const execute = async () => {
      if (firstRender.current) {
        firstRender.current = false;
        setPlanState(newPlan);
        setPlaidItemsState(plaidItems);
        setUsersState(
          users.filter((user) => user.emails[0].email !== userEmail.email)
        );
        setCurrentUserId(userId);
        setCurrentUserRole(userRole);
        setNonce(nonce);
      } else {
        if (
          startDateState === previousDates.current.startDate &&
          endDateState === previousDates.current.endDate
        ) {
          setIsRefreshing(true);
        }
        const getPlanTime = performance.now();
        await getPlan();
        const getPlanTimeEnd = performance.now();
        const plannedWaitTime = Math.max(
          0,
          300 - (getPlanTimeEnd - getPlanTime)
        );
        await new Promise((resolve) => setTimeout(resolve, plannedWaitTime));
        setIsRefreshing(false);
        previousDates.current = {
          startDate: startDateState,
          endDate: endDateState,
        };
      }
    };

    execute();
  }, [startDateState, endDateState, triggerRefresh]);

  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const scrollAreaRef = useRef(null);

  const handleScrollAreaFocus = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.focus();
    }
  };

  const isStandalone = useStandalone();

  return (
    <StartDateContext.Provider value={{ startDateState, setStartDateState }}>
      <EndDateContext.Provider value={{ endDateState, setEndDateState }}>
        <PageContext.Provider value={{ page, setPage }}>
          <div className="fixed top-[94vh] h-[1000px] w-screen bg-primary z-50" />
          <main
            className="w-full h-[100vh] overflow-hidden fixed inset-0 touch-none pt-safe pl-safe pr-safe pb-safe"
            onTouchStart={handleScrollAreaFocus}
            onMouseDown={handleScrollAreaFocus}
          >
            {/* <div className="absolute bottom-0 h-[env(safe-area-inset-bottom)] w-full bg-card z-10 -m-[env(safe-area-inset-bottom)]" /> */}
            <ScrollAreaWithPulldown
              className={`h-[94%] w-screen fixed top-0`}
              ref={scrollAreaRef}
              onTouchStart={handleScrollAreaFocus}
              triggerRefresh={() => {
                setTriggerRefresh(!triggerRefresh);
              }}
              isRefreshing={isRefreshing}
            >
              {children}
            </ScrollAreaWithPulldown>
            <NavBar
              page={page}
              setPage={setPage}
              userRole={userRole}
              accountDropdownOpen={accountDropdownOpen}
              setAccountDropdownOpen={setAccountDropdownOpen}
            />
            {/* <ChatWidget /> */}
          </main>
        </PageContext.Provider>
      </EndDateContext.Provider>
    </StartDateContext.Provider>
  );
}
