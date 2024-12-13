'use client';

import * as React from 'react';
import { Frame, Map, PieChart, BadgePlus, HandCoins } from 'lucide-react';

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
  ],
  navLink: [
    {
      title: 'Financial Institutions',
      url: '/app/financial-institutions',
      icon: Map,
      isActive: false,
    },
  ],
};

export function AppSidebar({ ...props }) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <BudgetSwitcher budgets={data.budgets} />
      </SidebarHeader>
      <SidebarContent>
        <NavTrack items={data.navTrack} label="Track" />
        <NavTrack items={data.navLink} label="Link" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
