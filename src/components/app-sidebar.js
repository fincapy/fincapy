'use client';

import * as React from 'react';
import { Map, BadgePlus, HandCoins, Wallet, Landmark } from 'lucide-react';

import { NavTrack } from '@/components/nav-track';
import { BudgetSwitcher } from '@/components/budget-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// This is sample data.
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  budgets: [
    {
      name: 'Budget 1',
    },
    {
      name: 'Budget 2',
    },
    {
      name: 'Budget 3',
    },
  ],
  navTrack: [
    {
      title: 'Spending',
      page: 'spending',
      icon: HandCoins,
      isActive: true,
    },
    {
      title: 'Income',
      page: 'income',
      icon: BadgePlus,
      isActive: false,
    },
    {
      title: 'Savings',
      page: 'savings',
      icon: Wallet,
      isActive: false,
    },
  ],
  navLink: [
    {
      title: 'Financial Institutions',
      page: 'financial-institutions',
      icon: Landmark,
      isActive: false,
    },
  ],
};

export function AppSidebar({ page, setPage, ...props }) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <BudgetSwitcher budgets={data.budgets} />
      </SidebarHeader>
      <SidebarContent>
        <NavTrack
          items={data.navTrack}
          label="Track"
          page={page}
          setPage={setPage}
        />
        <NavTrack
          items={data.navLink}
          label="Link"
          page={page}
          setPage={setPage}
        />
      </SidebarContent>
    </Sidebar>
  );
}
