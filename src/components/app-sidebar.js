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
import { useRouter } from 'next/router';

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
      url: '/app/spending',
      icon: HandCoins,
      isActive: true,
    },
    {
      title: 'Income',
      url: '/app/income',
      icon: BadgePlus,
      isActive: false,
    },
    {
      title: 'Savings',
      url: '/app/savings',
      icon: Wallet,
      isActive: false,
    },
  ],
  navLink: [
    {
      title: 'Financial Institutions',
      url: '/app/financial-institutions',
      icon: Landmark,
      isActive: false,
    },
  ],
};

export function AppSidebar({ ...props }) {
  const router = useRouter();
  data.navTrack.forEach((navItem) => {
    router.prefetch(navItem.url);
  });
  data.navLink.forEach((navItem) => {
    router.prefetch(navItem.url);
  });

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <BudgetSwitcher budgets={data.budgets} />
      </SidebarHeader>
      <SidebarContent>
        <NavTrack items={data.navTrack} label="Track" />
        <NavTrack items={data.navLink} label="Link" />
      </SidebarContent>
    </Sidebar>
  );
}
