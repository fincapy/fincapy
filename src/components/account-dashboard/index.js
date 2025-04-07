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
import { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  Shield,
} from 'lucide-react';
import { parse } from 'date-fns';
import {
  planAtom,
  plaidItemsAtom,
  usersAtom,
  currentUserIdAtom,
  currentUserRoleAtom,
  currentUserAtom,
  nonceAtom,
} from '../state/atoms';
import { useSetAtom } from 'jotai';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStandalone } from '@/hooks/use-standalone';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import Dashboard from '@/components/users-dashboard';
import FinancialInstitutionsDashboard from '../financial-institutions-dashboard';
import { useAtomValue } from 'jotai';

const AccountPage = ({ setPage, userEmail }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const currentUser = useAtomValue(currentUserAtom);
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const setPageCookie = (page) => {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    document.cookie = `page=${page}; expires=${expires.toUTCString()}; path=/app`;
  };

  const changePage = (page) => {
    setPage(page);
    setPageCookie(page);
  };

  const showNotImplemented = () => {
    toast({
      title: 'Not implemented',
      description: 'This feature is not yet implemented.',
      duration: 3000,
    });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsNavOpen(false);
  };

  return (
    <div className="flex flex-col w-full h-full px-4 md:px-6">
      <div className="w-full max-w-5xl mx-auto">
        {/* Mobile dropdown navigation */}
        <div className="md:hidden w-full my-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full flex items-center justify-between"
              >
                <span className="flex items-center">
                  {activeTab === 'profile' && (
                    <UserRound className="h-4 w-4 mr-2" />
                  )}
                  {activeTab === 'users' && <Users className="h-4 w-4 mr-2" />}
                  {activeTab === 'financial' && (
                    <Landmark className="h-4 w-4 mr-2" />
                  )}
                  {activeTab === 'billing' && (
                    <CircleDollarSign className="h-4 w-4 mr-2" />
                  )}
                  {activeTab === 'security' && (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[calc(100vw-2rem)] bg-card"
              align="start"
            >
              <DropdownMenuItem
                className={
                  activeTab === 'profile'
                    ? 'bg-accent text-accent-foreground'
                    : ''
                }
                onSelect={() => setActiveTab('profile')}
              >
                <UserRound className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>

              {currentUser.role === 'owner' && (
                <DropdownMenuItem
                  className={
                    activeTab === 'users'
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  onSelect={() => setActiveTab('users')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Users
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className={
                  activeTab === 'financial'
                    ? 'bg-accent text-accent-foreground'
                    : ''
                }
                onSelect={() => setActiveTab('financial')}
              >
                <Landmark className="h-4 w-4 mr-2" />
                Financial Institutions
              </DropdownMenuItem>

              {currentUser.role === 'owner' && (
                <DropdownMenuItem
                  className={
                    activeTab === 'billing'
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  }
                  onSelect={() => setActiveTab('billing')}
                >
                  <CircleDollarSign className="h-4 w-4 mr-2" />
                  Billing
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className={
                  activeTab === 'security'
                    ? 'bg-accent text-accent-foreground'
                    : ''
                }
                onSelect={() => setActiveTab('security')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Security
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop tabs navigation */}
        <div className="hidden md:flex border-b border-border w-full mb-6 mt-2">
          <button
            className={`px-4 py-2 -mb-px font-medium text-sm ${
              activeTab === 'profile'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center">
              <UserRound className="h-4 w-4 mr-2" />
              Profile
            </div>
          </button>

          {currentUser.role === 'owner' && (
            <button
              className={`px-4 py-2 -mb-px font-medium text-sm ${
                activeTab === 'users'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('users')}
            >
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Users
              </div>
            </button>
          )}

          <button
            className={`px-4 py-2 -mb-px font-medium text-sm ${
              activeTab === 'financial'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('financial')}
          >
            <div className="flex items-center">
              <Landmark className="h-4 w-4 mr-2" />
              Financial Institutions
            </div>
          </button>

          {currentUser.role === 'owner' && (
            <button
              className={`px-4 py-2 -mb-px font-medium text-sm ${
                activeTab === 'billing'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('billing')}
            >
              <div className="flex items-center">
                <CircleDollarSign className="h-4 w-4 mr-2" />
                Billing
              </div>
            </button>
          )}

          <button
            className={`px-4 py-2 -mb-px font-medium text-sm ${
              activeTab === 'security'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab('security')}
          >
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </div>
          </button>
        </div>

        <div className="w-full mb-16">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-4 md:p-6 shadow-sm">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Personal Information
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Email
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm break-all">
                        {userEmail?.email || 'Not available'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={showNotImplemented}
                        className="w-full md:w-auto"
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Full Name
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm break-all">
                        {userEmail?.name || 'Not set'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={showNotImplemented}
                        className="w-full md:w-auto"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && currentUser.role === 'owner' && (
            <div className="w-full overflow-x-auto">
              <Dashboard />
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="w-full overflow-x-auto">
              <FinancialInstitutionsDashboard />
            </div>
          )}

          {activeTab === 'billing' && currentUser.role === 'owner' && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-4 md:p-6 shadow-sm">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Billing
                </h2>
                <p className="text-muted-foreground mb-6">
                  Upgrade your subscription, change payment methods, or cancel
                  with Stripe.
                </p>
                <div className="flex justify-center">
                  <a
                    href="https://billing.stripe.com/p/login/test_7sI28i4mUcdG8Ok4gg"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto"
                  >
                    <Button className="w-full text-white">
                      <CreditCard className="" />
                      Manage Billing
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-card rounded-lg border border-border p-4 md:p-6 shadow-sm">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Security Settings
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Password
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm">••••••••</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={showNotImplemented}
                        className="w-full md:w-auto"
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Two-Factor Authentication
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm">Not enabled</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={showNotImplemented}
                        className="w-full md:w-auto"
                      >
                        Set Up 2FA
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Reset 2FA Device
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
                      <span className="text-sm text-muted-foreground">
                        If you lost access to your 2FA device
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={showNotImplemented}
                        className="w-full md:w-auto"
                      >
                        Reset Device
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-lg border border-border p-4 md:p-6 shadow-sm">
                <h2 className="text-lg md:text-xl font-semibold mb-4">
                  Sign Out
                </h2>
                <div className="flex">
                  <a href="/api/signout" className="w-full">
                    <Button variant="destructive" className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { AccountPage };
