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
import { Sparkles } from 'lucide-react';
import { BadgeCheck } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Bell } from 'lucide-react';
import { Fragment } from 'react';
import Link from 'next/link';
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
import CategoryDashboard from '@/components/category-dashboard';

function capitalize(word) {
  if (!word) return ''; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const getInitials = (name) => {
  const [firstName, lastName] = name.split(' ');
  return firstName.charAt(0) + lastName.charAt(0);
};

const AvatarDropdown = ({ userName, userRole }) => {
  const initials = getInitials(userName);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-full">
          <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
          <AvatarImage alt={userName} />
        </Avatar>
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
              <DropdownMenuItem className="cursor-pointer">
                <Link
                  className="w-full flex items-center content-center gap-2"
                  href="/app/manage-users"
                >
                  <BadgeCheck size={16} />
                  Manage users
                </Link>
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
  const path = usePathname();
  const pageName = path.split('/').pop();
  const pageNameSeparated = pageName.split('-').join(' ');
  const capitalizedPageName = pageNameSeparated
    .split(' ')
    .map(capitalize)
    .join(' ');

  plan.categories = plan.categories.map((category) => {
    category.subcategories = category.subcategories.map((subcategory) => {
      return new Subcategory(subcategory);
    });
    return new Category(category);
  });

  const [planState, setPlanState] = useState(new Plan(plan));
  const [startDateState, setStartDateState] = useState(
    startDate.toISOString().split('T')[0]
  );
  const [endDateState, setEndDateState] = useState(
    endDate.toISOString().split('T')[0]
  );
  const [usersState, setUsersState] = useState(users);
  const [plaidItemsState, setPlaidItemsState] = useState(plaidItems);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      nonce={nonce}
    >
      <PlanContext.Provider value={{ planState, setPlanState }}>
        <StartDateContext.Provider
          value={{ startDateState, setStartDateState }}
        >
          <EndDateContext.Provider value={{ endDateState, setEndDateState }}>
            <UsersContext.Provider value={{ usersState, setUsersState }}>
              <PlaidItemsContext.Provider
                value={{ plaidItemsState, setPlaidItemsState }}
              >
                <SidebarProvider>
                  <AppSidebar />
                  <main className="w-full h-screen overflow-hidden">
                    <div className="flex flex-col gap-2 bg-background top-0 z-20">
                      <div className="flex flex-row items-center gap-3 mt-2">
                        <SidebarTrigger className="ml-2" />
                        <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                          {capitalizedPageName}
                        </h1>
                        <div className="flex flex-row justify-end flex-grow mr-3">
                          <div className="flex flex-row items-center gap-3">
                            <ModeToggle />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                            >
                              <AvatarDropdown
                                userName={userName}
                                userRole={userRole}
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </div>
                    <ChatWidget />
                    <ScrollArea className="w-full h-full">
                      {children}
                    </ScrollArea>
                  </main>
                </SidebarProvider>
              </PlaidItemsContext.Provider>
            </UsersContext.Provider>
          </EndDateContext.Provider>
        </StartDateContext.Provider>
      </PlanContext.Provider>
    </ThemeProvider>
  );
}
