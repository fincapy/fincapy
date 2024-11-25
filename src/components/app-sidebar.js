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
  navMain: [
    {
      title: 'Spending',
      url: '#',
      icon: HandCoins,
      isActive: true,
      items: [
        {
          title: 'History',
          url: '#',
        },
        {
          title: 'Starred',
          url: '#',
        },
        {
          title: 'Settings',
          url: '#',
        },
      ],
    },
    {
      title: 'Income',
      url: '#',
      icon: BadgePlus,
      items: [
        {
          title: 'Genesis',
          url: '#',
        },
        {
          title: 'Explorer',
          url: '#',
        },
        {
          title: 'Quantum',
          url: '#',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
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
        <NavTrack items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
