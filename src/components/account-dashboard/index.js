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
  CheckCircle2,
  Mail,
  AlertCircle,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { SignInReauthForm } from '@/components/sign-in-reauth-form';
import { TOTPVerificationReauthForm } from '@/components/totp-verification-reauth-form';
import { TOTPRegistrationReauthForm } from '../totp-registration-reauth-form';
import { AccountSetPasswordForm } from '@/components/account-set-password-form';
import { Card, CardContent } from '../ui/card';
import {
  addEmailAddress,
  verifyEmailAddress,
  resendEmailVerification,
} from './serverActions';
import { InputTOTP } from '../input-totp';

const AccountPage = ({ setPage, userEmail }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const currentUser = useAtomValue(currentUserAtom);
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Reauthentication state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isReset2FAModalOpen, setIsReset2FAModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState('emailPassword'); // emailPassword, totp, action

  // Email management state
  const [isAddEmailModalOpen, setIsAddEmailModalOpen] = useState(false);
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

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

  // Handlers for opening password change modal
  const openChangePasswordModal = () => {
    setIsChangePasswordModalOpen(true);
    setAuthStep('emailPassword');
  };

  // Handlers for opening reset 2FA modal
  const openReset2FAModal = () => {
    setIsReset2FAModalOpen(true);
    setAuthStep('emailPassword');
  };

  // Handle successful email/password authentication for any modal
  const handleEmailPasswordSuccess = () => {
    setAuthStep('totp');
  };

  // Handle successful TOTP verification for password change
  const handleTOTPSuccessForPassword = () => {
    setAuthStep('action');
  };

  // Handle successful TOTP verification for 2FA reset
  const handleTOTPSuccessFor2FA = () => {
    setAuthStep('action');
  };

  // Handle email actions
  const handleAddEmail = async () => {
    setIsSubmitting(true);
    setEmailError('');

    try {
      const result = await addEmailAddress(newEmail);

      if (result.success) {
        toast({
          title: 'Email added',
          description: 'A verification code has been sent to your email.',
          duration: 3000,
        });
        setIsAddEmailModalOpen(false);
        setEmailToVerify(newEmail);
        setIsVerifyEmailModalOpen(true);
      } else {
        setEmailError(result.error || 'Failed to add email address');
      }
    } catch (error) {
      setEmailError('An unexpected error occurred');
      console.error('Add email error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmail = async (code) => {
    setIsSubmitting(true);
    setEmailError('');

    try {
      const result = await verifyEmailAddress(emailToVerify, code);

      if (result.success) {
        toast({
          title: 'Email verified',
          description: 'Your email address has been verified successfully.',
          duration: 3000,
        });
        setIsVerifyEmailModalOpen(false);

        // Force refresh of user data
        window.location.reload();
      } else {
        setEmailError(result.error || 'Failed to verify email address');
      }
    } catch (error) {
      setEmailError('An unexpected error occurred');
      console.error('Verify email error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async (email) => {
    setIsSubmitting(true);
    setEmailError('');

    try {
      const result = await resendEmailVerification(email);

      if (result.success) {
        toast({
          title: 'Verification code sent',
          description: 'A new verification code has been sent to your email.',
          duration: 3000,
        });

        if (!isVerifyEmailModalOpen) {
          setEmailToVerify(email);
          setIsVerifyEmailModalOpen(true);
        }
      } else {
        setEmailError(result.error || 'Failed to resend verification code');
      }
    } catch (error) {
      setEmailError('An unexpected error occurred');
      console.error('Resend verification error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle the 2FA reset
  const handleReset2FA = async () => {
    // TODO: Implement actual 2FA reset API call here

    // Show success toast and close modal
    toast({
      title: '2FA reset successful',
      description:
        "Your 2FA device has been reset. You'll be logged out and asked to set up 2FA on your next login.",
      duration: 5000,
    });

    setIsReset2FAModalOpen(false);

    // In a real implementation, we might redirect to logout after a short delay
    // setTimeout(() => window.location.href = '/api/signout', 3000);
  };

  // Handle modal close for either modal
  const handleCloseModal = () => {
    setIsChangePasswordModalOpen(false);
    setIsReset2FAModalOpen(false);
    setAuthStep('emailPassword');
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
                <h2 className="text-lg font-semibold mb-4">
                  Personal Information
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-2">
                      Email Addresses
                    </label>
                    <div className="space-y-4">
                      {currentUser.emails.map((email) => (
                        <div
                          key={email.email}
                          className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between p-3 border border-border rounded-md"
                        >
                          <div className="flex flex-col">
                            <div className="flex flex-row items-center gap-2">
                              <span className="text-md break-all">
                                {email.email}
                              </span>
                              {email.verified ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs text-white">
                                      Verified
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AlertCircle className="h-4 w-4 text-amber-500" />
                                    </TooltipTrigger>
                                    <TooltipContent className="text-xs text-white">
                                      Not verified
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              {email.primary && (
                                <span className="text-sm text-muted-foreground">
                                  primary
                                </span>
                              )}
                            </div>
                            {!email.verified && (
                              <span className="text-xs text-amber-500 mt-1">
                                Please verify this email address
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:gap-2">
                            {!email.primary && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={showNotImplemented}
                                className="w-full md:w-auto"
                              >
                                Set Primary
                              </Button>
                            )}
                            {!email.verified && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleResendVerification(email.email)
                                }
                                className="w-full md:w-auto"
                                disabled={isSubmitting}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                Verify
                              </Button>
                            )}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={showNotImplemented}
                                      className="w-full md:w-auto"
                                      disabled={email.primary}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </TooltipTrigger>
                                {email.primary && (
                                  <TooltipContent className="text-xs text-white">
                                    Cannot remove primary email address
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      ))}

                      {/* Add new email section */}
                      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between p-3 border border-border rounded-md border-dashed">
                        <div className="flex flex-col">
                          <span className="text-md break-all">
                            Add another email address
                          </span>
                          <span className="text-sm text-muted-foreground">
                            You can add additional email addresses to your
                            account
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsAddEmailModalOpen(true)}
                          className="w-full md:w-auto"
                        >
                          Add Email
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-2">
                      Full Name
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between p-3 border border-border rounded-md">
                      <span className="text-md break-all">
                        {currentUser.name}
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
                <h2 className="text-lg font-semibold mb-4">Billing</h2>
                <p className="text-md text-muted-foreground mb-6">
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
                <h2 className="text-lg font-semibold mb-4">
                  Security Settings
                </h2>
                <div className="space-y-5">
                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-2">
                      Password
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between border border-border rounded-md p-3">
                      <span className="text-md">••••••••</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openChangePasswordModal}
                        className="w-full md:w-auto"
                      >
                        Change Password
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-md font-medium text-muted-foreground mb-2">
                      Reset 2FA Device
                    </label>
                    <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between border border-border rounded-md p-3">
                      <span className="text-md text-muted-foreground">
                        If you lost access to your 2FA device
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openReset2FAModal}
                        className="w-full md:w-auto"
                      >
                        Reset Device
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Link href="/api/signout" className="w-full">
                <Button
                  variant="destructive"
                  className="w-full text-white mt-4 font-bold hover:bg-destructive-foreground"
                >
                  <LogOut className="mr-2 h-4 w-4 text-white" />
                  Sign Out
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      >
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              {authStep === 'emailPassword' &&
                'Confirm your identity to change your password.'}
              {authStep === 'totp' &&
                'Enter your 2FA verification code to continue.'}
              {authStep === 'action' && 'Enter your new password.'}
            </DialogDescription>
          </DialogHeader>

          {authStep === 'emailPassword' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <SignInReauthForm
                email={currentUser.emails[0]?.email || ''}
                onSuccess={handleEmailPasswordSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'totp' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <TOTPVerificationReauthForm
                onSuccess={handleTOTPSuccessForPassword}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'action' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <AccountSetPasswordForm
                onSuccess={() => {
                  // Show success toast
                  toast({
                    title: 'Password updated',
                    description: 'Your password has been successfully changed.',
                    duration: 3000,
                  });

                  // Close modal
                  setIsChangePasswordModalOpen(false);
                }}
                onCancel={handleCloseModal}
                onTokenInvalid={() => {
                  // Return to email/password step with notification
                  setAuthStep('emailPassword');
                  toast({
                    title: 'Authentication expired',
                    description:
                      'Your authentication has expired. Please re-authenticate to continue.',
                    variant: 'destructive',
                    duration: 5000,
                  });
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset 2FA Modal */}
      <Dialog open={isReset2FAModalOpen} onOpenChange={setIsReset2FAModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Reset 2FA Device</DialogTitle>
            <DialogDescription>
              {authStep === 'emailPassword' &&
                'Confirm your identity to reset your 2FA device.'}
              {authStep === 'totp' &&
                'Enter your current 2FA verification code to continue.'}
              {authStep === 'action' &&
                'Are you sure you want to reset your 2FA device?'}
            </DialogDescription>
          </DialogHeader>

          {authStep === 'emailPassword' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <SignInReauthForm
                email={currentUser.emails[0]?.email || ''}
                onSuccess={handleEmailPasswordSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'totp' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <TOTPVerificationReauthForm
                onSuccess={handleTOTPSuccessFor2FA}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'action' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <div className="flex flex-col items-center justify-center gap-1 w-full">
                <div className="flex flex-col gap-6 w-full items-center mt-6">
                  <TOTPRegistrationReauthForm
                    onSuccess={() => {
                      toast({
                        title: '2FA device reset',
                        description:
                          'Your 2FA device has been reset! Please use your new device on next sign in.',
                        duration: 5000,
                      });
                      setIsReset2FAModalOpen(false);
                    }}
                    onCancel={handleCloseModal}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Email Modal */}
      <Dialog open={isAddEmailModalOpen} onOpenChange={setIsAddEmailModalOpen}>
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Add Email Address</DialogTitle>
            <DialogDescription>
              Enter a new email address to add to your account. We'll send a
              verification code to this address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="your.email@example.com"
                className="w-full"
                disabled={isSubmitting}
              />
              {emailError && (
                <span className="text-xs text-destructive">{emailError}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddEmailModalOpen(false);
                setNewEmail('');
                setEmailError('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEmail}
              disabled={isSubmitting || !newEmail.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Adding</span>
                  <span className="animate-spin">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  </span>
                </>
              ) : (
                'Add Email'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Email Modal */}
      <Dialog
        open={isVerifyEmailModalOpen}
        onOpenChange={setIsVerifyEmailModalOpen}
      >
        <DialogContent className="sm:max-w-md bg-card">
          <DialogHeader>
            <DialogTitle>Verify Email Address</DialogTitle>
            <DialogDescription>
              Enter the 6-digit verification code sent to {emailToVerify}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center justify-center">
              <InputTOTP
                onComplete={async (code) => await handleVerifyEmail(code)}
                disabled={isSubmitting}
              />
              {emailError && (
                <span className="text-xs text-destructive mt-2">
                  {emailError}
                </span>
              )}
            </div>

            <div className="flex w-full flex-col items-center justify-center">
              <Button
                variant="link"
                className="text-xs text-muted-foreground hover:text-primary"
                onClick={() => handleResendVerification(emailToVerify)}
                disabled={isSubmitting}
              >
                Didn&apos;t receive the code? Resend
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsVerifyEmailModalOpen(false);
                setEmailToVerify('');
                setEmailError('');
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { AccountPage };
