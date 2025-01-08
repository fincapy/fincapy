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
import { Fragment } from 'react';
import Link from 'next/link';
import { ChatWidget } from '@/components/chat-widget';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
function capitalize(word) {
  if (!word) return ''; // Handle empty or undefined input
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

const getInitials = (name) => {
  const [firstName, lastName] = name.split(' ');
  return firstName.charAt(0) + lastName.charAt(0);
};

const AvatarDropdown = ({ auth0User, user }) => {
  const initials = getInitials(auth0User.name);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="rounded-full">
          <AvatarFallback className="rounded-full">{initials}</AvatarFallback>
          <AvatarImage src={auth0User.custom_picture} alt={auth0User.name} />
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="end"
        sideOffset={4}
      >
        {user.role === 'owner' && (
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

export default function DashboardLayout({ children, auth0User, user }) {
  const path = usePathname();
  const pageName = path.split('/').pop();
  const pageNameSeparated = pageName.split('-').join(' ');
  const capitalizedPageName = pageNameSeparated
    .split(' ')
    .map(capitalize)
    .join(' ');

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
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
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <AvatarDropdown auth0User={auth0User} user={user} />
                  </Button>
                </div>
              </div>
            </div>
            <Separator />
          </div>
          <ChatWidget />
          <ScrollArea className="w-full h-full">{children}</ScrollArea>
        </main>
      </SidebarProvider>
    </ThemeProvider>
  );
}
