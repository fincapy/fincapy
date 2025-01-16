'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from '@/components/theme-provider';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { planAtom, plaidItemsAtom } from '../state/atoms';
import { useSetAtom } from 'jotai';
import { useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
const AccountDropdown = ({
  accountDropdownOpen,
  setAccountDropdownOpen,
  userRole,
  setPage,
  page,
}) => {
  return (
    <DropdownMenu
      open={accountDropdownOpen}
      onOpenChange={setAccountDropdownOpen}
    >
      <DropdownMenuTrigger asChild>
        <button className="flex flex-col items-center gap-[1px] group outline-none">
          <UserRound
            size={16}
            className={
              accountDropdownOpen ||
              page === 'manage-users' ||
              page === 'financial-institutions'
                ? 'text-foreground'
                : 'text-muted-foreground group-hover:text-foreground'
            }
          />
          <span
            className={
              accountDropdownOpen ||
              page === 'manage-users' ||
              page === 'financial-institutions'
                ? 'text-[10px] font-bold text-foreground'
                : 'text-[10px] font-bold text-muted-foreground group-hover:text-foreground'
            }
          >
            Account
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {userRole === 'owner' && (
          <Fragment>
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2"
                onClick={() => setPage('manage-users')}
              >
                <Users size={16} />
                Users
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2"
                onClick={() => setPage('financial-institutions')}
              >
                <Landmark size={16} />
                Financial Institutions
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
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
            href="/api/auth/logout"
          >
            <LogOut size={16} />
            Log out
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
  return (
    <div className="flex flex-col items-center justify-center bg-background z-20 w-full mx-auto h-11 sticky bottom-0">
      <Separator className="w-screen" />
      <div className="flex flex-row justify-center items-center lg:w-[33.33%] md:w-[50%] w-11/12">
        <div className="flex flex-row h-10 justify-between items-center flex-1">
          <button
            onClick={() => setPage('spending')}
            className="flex flex-col items-center gap-[1px] group"
          >
            <HandCoins
              size={16}
              className={
                page === 'spending'
                  ? ''
                  : 'text-muted-foreground group-hover:text-foreground'
              }
            />
            <span
              className={
                page === 'spending'
                  ? 'text-[10px] font-bold'
                  : 'text-[10px] font-bold text-muted-foreground group-hover:text-foreground'
              }
            >
              Spending
            </span>
          </button>
          <button
            onClick={() => setPage('income')}
            className="flex flex-col items-center gap-[1px] group"
          >
            <CircleDollarSign
              size={16}
              className={
                page === 'income'
                  ? ''
                  : 'text-muted-foreground group-hover:text-foreground'
              }
            />
            <span
              className={
                page === 'income'
                  ? 'text-[10px] font-bold'
                  : 'text-[10px] font-bold text-muted-foreground group-hover:text-foreground'
              }
            >
              Income
            </span>
          </button>
          <button
            onClick={() => setPage('savings')}
            className="flex flex-col items-center gap-[1px] group"
          >
            <PiggyBank
              size={16}
              className={
                page === 'savings'
                  ? ''
                  : 'text-muted-foreground group-hover:text-foreground'
              }
            />
            <span
              className={
                page === 'savings'
                  ? 'text-[10px] font-bold'
                  : 'text-[10px] font-bold text-muted-foreground group-hover:text-foreground'
              }
            >
              Savings
            </span>
          </button>
          <button
            onClick={() => setPage('transactions')}
            className="flex flex-col items-center gap-[1px] group"
          >
            <Table
              size={16}
              className={
                page === 'transactions'
                  ? ''
                  : 'text-muted-foreground group-hover:text-foreground'
              }
            />
            <span
              className={
                page === 'transactions'
                  ? 'text-[10px] font-bold'
                  : 'text-[10px] font-bold text-muted-foreground group-hover:text-foreground'
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

export default function DashboardLayout({
  children,
  userName,
  userRole,
  nonce,
  plan,
  startDate,
  endDate,
  users,
  plaidItems,
}) {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get('page');
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

  const setPlanState = useSetAtom(planAtom);
  const setPlaidItemsState = useSetAtom(plaidItemsAtom);
  const [startDateState, setStartDateState] = useState(
    startDate.toISOString().split('T')[0]
  );
  const [endDateState, setEndDateState] = useState(
    endDate.toISOString().split('T')[0]
  );
  const [usersState, setUsersState] = useState(users);
  const [page, setPage] = useState(pageParam || 'spending');

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
    console.log('here first');
    if (firstRender.current) {
      firstRender.current = false;
      setPlanState(newPlan);
      setPlaidItemsState(plaidItems);
    } else {
      getPlan();
    }
  }, [startDateState, endDateState]);

  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <StartDateContext.Provider value={{ startDateState, setStartDateState }}>
        <EndDateContext.Provider value={{ endDateState, setEndDateState }}>
          <UsersContext.Provider value={{ usersState, setUsersState }}>
            <PageContext.Provider value={{ page, setPage }}>
              <main className="w-full h-screen flex flex-col relative">
                <ScrollArea className="flex-1">{children}</ScrollArea>
                <ChatWidget />
                {
                  <NavBar
                    page={page}
                    setPage={setPage}
                    isMobile={isMobile}
                    userRole={userRole}
                    accountDropdownOpen={accountDropdownOpen}
                    setAccountDropdownOpen={setAccountDropdownOpen}
                  />
                }
              </main>
            </PageContext.Provider>
          </UsersContext.Provider>
        </EndDateContext.Provider>
      </StartDateContext.Provider>
    </ThemeProvider>
  );
}
