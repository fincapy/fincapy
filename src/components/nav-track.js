'use client';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from './ui/button';

export function NavTrack({ items, label, page, setPage }) {
  const pathname = usePathname();
  const router = useRouter();

  const onClick = (item) => {
    setPage(item.page);
  };
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.url}
              onClick={() => onClick(item)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <item.icon style={{ margin: '0px' }} />
                <span className="flex items-center justify-center mt-[0.15rem]">
                  {item.title}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
