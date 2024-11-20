'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { ThemeProvider } from '@/components/theme-provider';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Sparkles } from 'lucide-react';
import { BadgeCheck } from 'lucide-react';
import { CreditCard } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Bell } from 'lucide-react';

function capitalize(word) {
  if (!word) return ''; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const getInitials = (name) => {
  const [firstName, lastName] = name.split(' ');
  return firstName.charAt(0) + lastName.charAt(0);
};

const AvatarDropdown = ({ user }) => {
  const initials = getInitials(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-full">
          <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
          <AvatarImage src={user.picture} alt={user.name} />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              {/* <AvatarImage src={user.avatar} alt={user.name} /> */}
              <AvatarFallback className="rounded-full">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              {/* <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs">{user.email}</span> */}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Sparkles />
            Upgrade to Pro
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <BadgeCheck />
            Account
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CreditCard />
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell />
            Notifications
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function DashboardLayout({ children, user }) {
  const path = usePathname();
  const pageName = path.split('/').pop();
  const capitalizedPageName = capitalize(pageName);
  const initials = getInitials(user.name);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center gap-5 mt-2">
              <SidebarTrigger className="ml-2" />
              <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {capitalizedPageName}
              </h1>
              <div className="flex flex-row justify-end flex-grow mr-3">
                <div className="flex flex-row items-center gap-3">
                  <ModeToggle />
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <AvatarDropdown user={user} />
                  </Button>
                </div>
              </div>
            </div>
            <Separator />
          </div>
          {children}
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
