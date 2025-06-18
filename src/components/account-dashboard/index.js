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
import { Fragment, useEffect, useState } from 'react';
import { ChatWidget } from '@/components/chat-widget';
import {
  ScrollAreaWithPulldown,
  ScrollBarWithPulldown,
} from '@/components/ui/scroll-area-with-pulldown';
import { useRef } from 'react';
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
  Lock as LockIcon,
  Key as KeyIcon,
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
  billingStatusAtom,
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
  setPrimaryEmail,
  removeEmail,
  changeUserName,
  disable2FA,
} from './serverActions';
import { useAtom } from 'jotai';
import { InputTOTP } from '../input-totp';
import { PlusIcon } from 'lucide-react';
import SubmitButton from '../SubmitButton';
import { PaywallOverlay } from '../ui/paywall-overlay';

const AccountPage = ({ setPage, userEmail }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const isMobile = useIsMobile();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const billingStatus = useAtomValue(billingStatusAtom);

  // Reauthentication state
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isReset2FAModalOpen, setIsReset2FAModalOpen] = useState(false);
  const [isEnable2FAModalOpen, setIsEnable2FAModalOpen] = useState(false);
  const [isDisable2FAModalOpen, setIsDisable2FAModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState('emailPassword'); // emailPassword, totp, action

  // Email management state
  const [isVerifyEmailModalOpen, setIsVerifyEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  // High-risk action state
  const [isHighRiskActionModalOpen, setIsHighRiskActionModalOpen] =
    useState(false);
  const [pendingHighRiskAction, setPendingHighRiskAction] = useState(null);

  // Name change state
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  // Check for OAuth success and restore state on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth') === 'success';
    const authError = urlParams.get('error');

    if (authSuccess) {
      // Clean up URL parameters immediately
      const url = new URL(window.location);
      url.searchParams.delete('auth');
      window.history.replaceState({}, '', url);

      try {
        // Restore state from sessionStorage
        const savedState = sessionStorage.getItem('postOAuthState');
        const savedAction = sessionStorage.getItem('pendingHighRiskAction');

        if (savedState && savedAction) {
          const state = JSON.parse(savedState);
          const action = JSON.parse(savedAction);

          // Check if the saved state is recent (within 10 minutes)
          const timeDiff = Date.now() - (state.timestamp || 0);
          if (timeDiff < 10 * 60 * 1000) {
            // Restore the modal state and pending action
            // Note: DashboardLayout will handle setting page to 'account'
            setPendingHighRiskAction(action);
            setIsHighRiskActionModalOpen(true);
            setAuthStep('action'); // OAuth was successful, go to action step

            toast({
              title: 'Authentication successful',
              description: 'Please complete your action.',
              duration: 3000,
            });
          }

          // Clean up sessionStorage
          sessionStorage.removeItem('postOAuthState');
          sessionStorage.removeItem('pendingHighRiskAction');
        }
      } catch (error) {
        console.warn('Failed to restore OAuth state:', error);
        // Clean up potentially corrupted data
        sessionStorage.removeItem('postOAuthState');
        sessionStorage.removeItem('pendingHighRiskAction');
      }
    } else if (authError) {
      // Handle OAuth errors
      const url = new URL(window.location);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url);

      // Clean up sessionStorage
      sessionStorage.removeItem('postOAuthState');
      sessionStorage.removeItem('pendingHighRiskAction');

      let errorMessage = 'Authentication failed';
      if (authError === 'authentication_mismatch') {
        errorMessage = 'Authentication failed: Account mismatch';
      } else if (authError === 'authentication_failed') {
        errorMessage = 'Authentication failed: Please try again';
      } else if (authError === 'oauth_error') {
        errorMessage = 'OAuth authentication failed';
      }

      toast({
        title: 'Authentication Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000,
      });
    }
  }, [toast]); // Empty dependency array - only run on mount

  // Return loading state if currentUser is not available yet
  if (!currentUser) {
    return (
      <div className="flex w-full flex-col h-full">
        <div className="max-w-6xl w-[95%] mx-auto">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">
              Loading your account...
            </p>
          </div>
        </div>
      </div>
    );
  }

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

  // Handlers for opening enable 2FA modal
  const openEnable2FAModal = () => {
    setIsEnable2FAModalOpen(true);
    setAuthStep('emailPassword');
  };

  // Handlers for opening disable 2FA modal
  const openDisable2FAModal = () => {
    setIsDisable2FAModalOpen(true);
    setAuthStep('emailPassword');
  };

  // Handle successful email/password authentication for any modal
  const handleEmailPasswordSuccess = () => {
    // Check if user has 2FA enabled
    if (currentUser.totpEnabled) {
      // User has 2FA enabled, proceed to TOTP verification
      setAuthStep('totp');
    } else {
      // User has 2FA disabled, proceed directly to the action step
      setAuthStep('action');
    }
  };

  // Handle successful TOTP verification for password change
  const handleTOTPSuccessForPassword = () => {
    setAuthStep('action');
  };

  // Handle successful TOTP verification for 2FA reset
  const handleTOTPSuccessFor2FA = () => {
    setAuthStep('action');
  };

  // Handle successful TOTP verification for disable 2FA
  const handleTOTPSuccessForDisable2FA = () => {
    setAuthStep('action');
  };

  // Handle successful TOTP setup for enable 2FA
  const handleTOTPSuccessForEnable2FA = (backupCodes) => {
    const newCurrentUser = {
      ...currentUser,
      totpEnabled: true,
    };
    setCurrentUser(newCurrentUser);
    toast({
      title: '2FA enabled',
      description:
        'Two-factor authentication has been enabled for your account. Please save your backup codes in a secure location.',
      duration: 5000,
    });
    setIsEnable2FAModalOpen(false);
    setAuthStep('emailPassword');
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
        setIsHighRiskActionModalOpen(false);
        setPendingHighRiskAction(null);
        setEmailToVerify(newEmail);
        setIsVerifyEmailModalOpen(true);
        setNewEmail('');
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
        const newCurrentUser = {
          ...currentUser,
        };
        newCurrentUser.emails.push({
          email: emailToVerify,
          verified: true,
          primary: false,
        });
        setCurrentUser(newCurrentUser);
        toast({
          title: 'Email verified',
          description: 'Your email address has been verified successfully.',
          duration: 3000,
        });
        setIsVerifyEmailModalOpen(false);
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

  // Handle modal close for either modal
  const handleCloseModal = () => {
    setIsChangePasswordModalOpen(false);
    setIsReset2FAModalOpen(false);
    setIsEnable2FAModalOpen(false);
    setIsDisable2FAModalOpen(false);
    setIsHighRiskActionModalOpen(false);
    setPendingHighRiskAction(null);
    setAuthStep('emailPassword');

    // Clean up sessionStorage when modal is closed
    try {
      sessionStorage.removeItem('postOAuthState');
      sessionStorage.removeItem('pendingHighRiskAction');
    } catch (error) {
      console.warn('Failed to clean up sessionStorage:', error);
    }
  };

  // Update the handleSetPrimaryEmail function
  const handleSetPrimaryEmail = async (email) => {
    const action = {
      type: 'setPrimary',
      email: email,
    };

    // Save action to sessionStorage in case we need OAuth
    try {
      sessionStorage.setItem('pendingHighRiskAction', JSON.stringify(action));
    } catch (error) {
      console.warn('Failed to save pending action:', error);
    }

    setPendingHighRiskAction(action);
    setIsHighRiskActionModalOpen(true);
    setAuthStep('emailPassword');
  };

  // Update the handleRemoveEmail function
  const handleRemoveEmail = async (email) => {
    const action = {
      type: 'removeEmail',
      email: email,
    };

    // Save action to sessionStorage in case we need OAuth
    try {
      sessionStorage.setItem('pendingHighRiskAction', JSON.stringify(action));
    } catch (error) {
      console.warn('Failed to save pending action:', error);
    }

    setPendingHighRiskAction(action);
    setIsHighRiskActionModalOpen(true);
    setAuthStep('emailPassword');
  };

  // Update the handleCompleteHighRiskAction function to always make the server call
  const handleCompleteHighRiskAction = async () => {
    if (!pendingHighRiskAction) return;

    setIsSubmitting(true);

    try {
      let result;
      if (pendingHighRiskAction.type === 'setPrimary') {
        result = await setPrimaryEmail(pendingHighRiskAction.email);
      } else if (pendingHighRiskAction.type === 'removeEmail') {
        result = await removeEmail(pendingHighRiskAction.email);
      }

      if (result.success) {
        // Update the currentUser state based on the action type
        const newCurrentUser = {
          ...currentUser,
        };

        if (pendingHighRiskAction.type === 'setPrimary') {
          // Update primary status for all emails
          newCurrentUser.emails = newCurrentUser.emails.map((email) => ({
            ...email,
            primary: email.email === pendingHighRiskAction.email,
          }));
        } else if (pendingHighRiskAction.type === 'removeEmail') {
          // Remove the email from the list
          newCurrentUser.emails = newCurrentUser.emails.filter(
            (email) => email.email !== pendingHighRiskAction.email
          );
        }

        // Update the state
        setCurrentUser(newCurrentUser);

        toast({
          title:
            pendingHighRiskAction.type === 'setPrimary'
              ? 'Primary email updated'
              : 'Email removed',
          description:
            pendingHighRiskAction.type === 'setPrimary'
              ? 'Your primary email address has been updated successfully.'
              : 'The email address has been removed from your account.',
          duration: 3000,
        });

        setIsHighRiskActionModalOpen(false);
        setPendingHighRiskAction(null);
      } else if (result.requiresAuth) {
        // Authentication expired, restart the flow
        setAuthStep('emailPassword');
        toast({
          title: 'Authentication expired',
          description:
            'Your authentication has expired. Please re-authenticate to continue.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to complete the action',
          variant: 'destructive',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('High risk action error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a function for TOTP Success for high risk actions
  const handleTOTPSuccessForHighRiskAction = () => {
    handleCompleteHighRiskAction();
  };

  // Handle name change
  const handleChangeName = async (newName) => {
    setIsSubmitting(true);

    try {
      const result = await changeUserName(newName);

      if (result.success) {
        const newCurrentUser = {
          ...currentUser,
          name: newName,
        };
        setCurrentUser(newCurrentUser);
        toast({
          title: 'Name updated',
          description: 'Your name has been updated successfully.',
          duration: 3000,
        });
        setIsEditingName(false);
        setNewName('');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update name',
          variant: 'destructive',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('Change name error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle disable 2FA
  const handleDisable2FA = async () => {
    setIsSubmitting(true);

    try {
      const result = await disable2FA();

      if (result.success) {
        const newCurrentUser = {
          ...currentUser,
          totpEnabled: false,
        };
        setCurrentUser(newCurrentUser);
        toast({
          title: '2FA disabled',
          description:
            'Two-factor authentication has been disabled for your account.',
          duration: 5000,
        });
        setIsDisable2FAModalOpen(false);
        setAuthStep('emailPassword');
      } else if (result.requiresAuth) {
        // Authentication expired, restart the flow
        setAuthStep('emailPassword');
        toast({
          title: 'Authentication expired',
          description:
            'Your authentication has expired. Please re-authenticate to continue.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to disable 2FA',
          variant: 'destructive',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
        duration: 3000,
      });
      console.error('Disable 2FA error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col h-full">
      <div className="max-w-6xl w-[95%] mx-auto">
        {/* Mobile dropdown navigation */}
        <div className="md:hidden w-full my-4 sticky top-0 z-50 bg-card/95 backdrop-blur rounded-xl shadow px-2 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="!outline-none !ring-0 !focus:outline-none !focus:ring-0 !focus:ring-offset-0 !focus-visible:outline-none !focus-visible:ring-0"
            >
              <Button
                variant="outline"
                className="w-full flex items-center justify-between text-md rounded-lg bg-background/80 shadow-sm border border-border px-4 py-3 font-semibold !outline-none !ring-0 !focus:outline-none !focus:ring-0 !focus:border-border !focus-visible:ring-0 !focus-visible:ring-offset-0 !focus-visible:outline-none !focus-visible:border-border transition-none focus:transition-none active:transition-none"
              >
                <span className="flex items-center text-md">
                  {activeTab === 'profile' && (
                    <UserRound size={24} className="mr-2 h-6 w-6" />
                  )}
                  {activeTab === 'users' && (
                    <Users size={24} className="mr-2" />
                  )}
                  {activeTab === 'financial-institutions' && (
                    <Landmark size={24} className="mr-2" />
                  )}
                  {activeTab === 'billing' && (
                    <CircleDollarSign className="mr-2" />
                  )}
                  {activeTab === 'security' && <Shield className="mr-2" />}
                  {activeTab === 'financial-institutions'
                    ? 'Financial Institutions'
                    : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[calc(100vw-2rem)] bg-card text-md"
              align="start"
            >
              <DropdownMenuItem
                className={
                  activeTab === 'profile'
                    ? 'bg-accent text-accent-foreground text-md'
                    : 'text-md'
                }
                onSelect={() => setActiveTab('profile')}
              >
                <UserRound className="mr-1" />
                Profile
              </DropdownMenuItem>

              {currentUser.role === 'owner' && (
                <DropdownMenuItem
                  className={
                    activeTab === 'users'
                      ? 'bg-accent text-accent-foreground text-md'
                      : 'text-md'
                  }
                  onSelect={() => setActiveTab('users')}
                >
                  <Users className="h-4 w-4 mr-1" />
                  Users
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className={
                  activeTab === 'financial-institutions'
                    ? 'bg-accent text-accent-foreground text-md'
                    : 'text-md'
                }
                onSelect={() => setActiveTab('financial-institutions')}
              >
                <Landmark className="mr-1" />
                Financial Institutions
              </DropdownMenuItem>

              {currentUser.role === 'owner' && (
                <DropdownMenuItem
                  className={
                    activeTab === 'billing'
                      ? 'bg-accent text-accent-foreground text-md'
                      : 'text-md'
                  }
                  onSelect={() => setActiveTab('billing')}
                >
                  <CircleDollarSign className="mr-1" />
                  Billing
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                className={
                  activeTab === 'security'
                    ? 'bg-accent text-accent-foreground text-md'
                    : 'text-md'
                }
                onSelect={() => setActiveTab('security')}
              >
                <Shield className="mr-1" />
                Security
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop tabs navigation */}
        <div className="hidden md:flex w-full mb-6 mt-2 sticky top-0 z-30 bg-card/95 backdrop-blur rounded-xl border border-border px-2 py-2 items-center gap-2 transition-all">
          <button
            className={`relative px-5 py-2 font-semibold text-base flex items-center gap-2 rounded-lg transition-all duration-200
              ${
                activeTab === 'profile'
                  ? 'text-amber-600'
                  : 'text-muted-foreground hover:text-amber-600 hover:bg-accent/40'
              }
            `}
            onClick={() => setActiveTab('profile')}
          >
            <UserRound className="mr-1 h-5 w-5" />
            Profile
            {activeTab === 'profile' && (
              <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-b bg-amber-600/60" />
            )}
          </button>

          {currentUser.role === 'owner' && (
            <button
              className={`relative px-5 py-2 font-semibold text-base flex items-center gap-2 rounded-lg transition-all duration-200
                ${
                  activeTab === 'users'
                    ? 'text-amber-600'
                    : 'text-muted-foreground hover:text-amber-600 hover:bg-accent/40'
                }
              `}
              onClick={() => setActiveTab('users')}
            >
              <Users className="h-5 w-5 mr-2" />
              Users
              {activeTab === 'users' && (
                <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-b bg-amber-600/60" />
              )}
            </button>
          )}

          <button
            className={`relative px-5 py-2 font-semibold text-base flex items-center gap-2 rounded-lg transition-all duration-200
              ${
                activeTab === 'financial-institutions'
                  ? 'text-amber-600'
                  : 'text-muted-foreground hover:text-amber-600 hover:bg-accent/40'
              }
            `}
            onClick={() => setActiveTab('financial-institutions')}
          >
            <Landmark className="h-5 w-5 mr-2" />
            Financial Institutions
            {activeTab === 'financial-institutions' && (
              <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-b bg-amber-600/60" />
            )}
          </button>

          {currentUser.role === 'owner' && (
            <button
              className={`relative px-5 py-2 font-semibold text-base flex items-center gap-2 rounded-lg transition-all duration-200
                ${
                  activeTab === 'billing'
                    ? 'text-amber-600'
                    : 'text-muted-foreground hover:text-amber-600 hover:bg-accent/40'
                }
              `}
              onClick={() => setActiveTab('billing')}
            >
              <CircleDollarSign className="h-5 w-5 mr-2" />
              Billing
              {activeTab === 'billing' && (
                <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-b bg-amber-600/60" />
              )}
            </button>
          )}

          <button
            className={`relative px-5 py-2 font-semibold text-base flex items-center gap-2 rounded-lg transition-all duration-200
              ${
                activeTab === 'security'
                  ? 'text-amber-600'
                  : 'text-muted-foreground hover:text-amber-600 hover:bg-accent/40'
              }
            `}
            onClick={() => setActiveTab('security')}
          >
            <Shield className="h-5 w-5 mr-2" />
            Security
            {activeTab === 'security' && (
              <span className="absolute left-2 right-2 -bottom-1 h-1 rounded-b bg-amber-600/60" />
            )}
          </button>
        </div>

        <div className="w-full mb-16">
          {activeTab === 'profile' && (
            <div className="space-y-6 relative">
              {/* Profile Header */}
              <div className="flex flex-col items-center justify-center mb-2">
                <UserRound className="h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold mb-1">Your Profile</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Manage your personal information. Keep your profile up to date
                  for a better experience.
                </p>
              </div>

              {/* Email Addresses Section */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <Mail className="h-8 w-8 text-primary" />
                  <span className="text-lg font-semibold">Email Addresses</span>
                </div>
                <div className="space-y-4">
                  {currentUser.emails &&
                    currentUser.emails.map((email) => (
                      <div
                        key={email.email}
                        className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between p-3 border border-border rounded-xl"
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex flex-row items-center w-full justify-between md:justify-start md:gap-2">
                            <span className="text-md break-all font-medium">
                              {email.email}
                            </span>
                            <div className="flex flex-row gap-1 md:ml-2">
                              {email.verified ? (
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                  Verified
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                                  Not Verified
                                </span>
                              )}
                              {email.primary && (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                                  Primary
                                </span>
                              )}
                            </div>
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
                              onClick={() => handleSetPrimaryEmail(email.email)}
                              className="w-full md:w-auto font-semibold"
                              disabled={isSubmitting || !email.verified}
                            >
                              Set Primary
                            </Button>
                          )}
                          {!email.verified && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleResendVerification(email.email)
                              }
                              className="w-full md:w-auto font-semibold"
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
                                    onClick={() =>
                                      handleRemoveEmail(email.email)
                                    }
                                    className="w-full md:w-auto font-semibold"
                                    disabled={email.primary || isSubmitting}
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
                  <Button
                    className="w-full min-h-16 flex items-center rounded-lg justify-center border-dashed border-2 bg-card hover:bg-background mt-2"
                    variant="outline"
                    onClick={() => {
                      const action = {
                        type: 'addEmail',
                      };

                      // Save action to sessionStorage in case we need OAuth
                      try {
                        sessionStorage.setItem(
                          'pendingHighRiskAction',
                          JSON.stringify(action)
                        );
                      } catch (error) {
                        console.warn('Failed to save pending action:', error);
                      }

                      setPendingHighRiskAction(action);
                      setIsHighRiskActionModalOpen(true);
                      setAuthStep('emailPassword');
                    }}
                  >
                    <PlusIcon size={48} />
                  </Button>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Your email addresses are used for account recovery and
                  notifications.
                </div>
              </div>

              {/* Divider */}
              <Separator className="my-2" />

              {/* Name Section */}
              <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                <div className="flex items-center gap-4 mb-4">
                  <UserRound className="h-8 w-8 text-primary" />
                  <span className="text-lg font-semibold">Name</span>
                </div>
                <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between p-3 border border-border rounded-xl">
                  {isEditingName ? (
                    <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2">
                      <Input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder={currentUser.name || 'No name set'}
                        className="flex-1"
                        disabled={isSubmitting}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingName(false);
                            setNewName('');
                          }}
                          disabled={isSubmitting}
                          className="w-full md:w-auto font-semibold"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => handleChangeName(newName)}
                          disabled={isSubmitting || !newName.trim()}
                          className="w-full md:w-auto text-white font-semibold"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="text-md break-all font-medium">
                        {currentUser.name || 'No name set'}
                      </span>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setNewName(currentUser.name || '');
                          setIsEditingName(true);
                        }}
                        className="w-full md:w-auto font-semibold"
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Your name is visible to other users in your organization.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && currentUser.role === 'owner' && (
            <div className="w-full overflow-x-auto space-y-6 relative">
              {/* Users Tab Header */}
              <div className="flex flex-col items-center justify-center mb-2">
                <Users className="h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold mb-1">Manage Users</h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Invite new users to your organization. You can add team
                  members by sending them an invitation. Only owners can manage
                  users.
                </p>
              </div>
              <Dashboard />
            </div>
          )}

          {activeTab === 'financial-institutions' && (
            <div className="w-full overflow-x-auto relative">
              <PaywallOverlay
                title="Upgrade Your Plan"
                description="Upgrade to a paid plan to connect unlimited financial institutions and automatically import transactions."
              >
                <FinancialInstitutionsDashboard />
              </PaywallOverlay>
            </div>
          )}

          {activeTab === 'billing' && currentUser.role === 'owner' && (
            <div className="space-y-6">
              {/* Billing Header */}
              <PaywallOverlay
                title="Upgrade Your Plan"
                description="Upgrade to a paid plan to manage your subscription, payment methods, and invoices securely. All payments are processed by Stripe."
              >
                <div className="flex flex-col items-center justify-center mb-2">
                  <CreditCard className="h-12 w-12 text-primary mb-2" />
                  <h2 className="text-2xl font-bold mb-1">
                    Billing & Subscription
                  </h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    Manage your subscription, payment methods, and invoices
                    securely. All payments are processed by Stripe.
                  </p>
                </div>

                {/* Billing Card */}
                <div className="bg-card rounded-xl border border-border p-6 shadow-md flex flex-col items-center gap-4 relative">
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className="h-8 w-8 text-primary" />
                    <span className="text-lg font-semibold">
                      Subscription Management
                    </span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      Powered by Stripe
                    </span>
                  </div>
                  <p className="text-md text-muted-foreground mb-4 text-center">
                    Upgrade your subscription, change payment methods, or cancel
                    anytime.
                  </p>
                  <a
                    href={`${process.env.NODE_ENV === 'production' ? 'https://billing.stripe.com/p/login/00gfZmh0FcG57VmaEE' : 'https://billing.stripe.com/test_7sI28i4mUcdG8Ok4gg'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto"
                  >
                    <SubmitButton className="w-full md:w-auto font-semibold flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Manage Billing
                    </SubmitButton>
                  </a>
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Your payment information is encrypted and securely processed
                    by Stripe. We never store your card details.
                  </div>
                </div>
              </PaywallOverlay>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 relative">
              {/* Security Header */}
              <div className="flex flex-col items-center justify-center mb-2">
                <Shield className="h-12 w-12 text-primary mb-2" />
                <h2 className="text-2xl font-bold mb-1">
                  Your Security Settings
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Manage your account security. We use industry best practices
                  to keep your data safe.
                </p>
              </div>

              {/* Password Section - Hidden for Google users */}
              {currentUser.authProvider !== 'google' && (
                <div className="bg-card rounded-xl border border-border p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <LockIcon className="h-8 w-8 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">Password</span>
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          Encrypted
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Your password is securely encrypted and never shared.
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl tracking-widest">••••••••</span>
                    <SubmitButton
                      onClick={openChangePasswordModal}
                      className="font-semibold text-sm"
                    >
                      Change Password
                    </SubmitButton>
                  </div>
                </div>
              )}

              {/* 2FA Section - Hidden for Google users */}
              {currentUser.authProvider !== 'google' && (
                <div className="bg-card rounded-xl border border-border p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <KeyIcon className="h-8 w-8 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold">
                          Two-Factor Authentication (2FA)
                        </span>
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                            currentUser.totpEnabled
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {currentUser.totpEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {currentUser.totpEnabled
                          ? 'Your account is protected with an extra layer of security.'
                          : 'Add an extra layer of security to your account.'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUser.totpEnabled ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={openReset2FAModal}
                          className="font-semibold"
                        >
                          Reset Device
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={openDisable2FAModal}
                          className="font-semibold text-white hover:bg-red-900"
                        >
                          Disable 2FA
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="default"
                        onClick={openEnable2FAModal}
                        className="font-semibold"
                      >
                        Enable 2FA
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Google Auth Info Section - Shown for Google users */}
              {currentUser.authProvider === 'google' && (
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 shadow-md">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">G</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-blue-900">
                          Google Authentication
                        </span>
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                          Active
                        </span>
                      </div>
                      <span className="text-sm text-blue-700">
                        Your account is secured with Google&apos;s
                        authentication system.
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <p className="text-sm text-blue-800 mb-2">
                      <strong>Security managed by Google:</strong>
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Password management through your Google account</li>
                      <li>
                        • Two-factor authentication via Google&apos;s security
                        settings
                      </li>
                      <li>
                        • Advanced threat protection and account monitoring
                      </li>
                    </ul>
                    <div className="mt-4">
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Manage Google Security Settings
                        <svg
                          className="ml-1 w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider */}
              <Separator className="my-2" />

              {/* Sign Out Section */}
              <div className="bg-destructive/10 rounded-xl border border-destructive/30 p-6 shadow flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <LogOut className="h-8 w-8 text-destructive" />
                  <div>
                    <span className="text-lg font-semibold text-destructive">
                      Sign Out
                    </span>
                    <p className="text-sm text-destructive/80">
                      Sign out of your account securely.
                    </p>
                  </div>
                </div>
                <Link href="/api/signout" className="w-full md:w-auto">
                  <Button
                    variant="destructive"
                    className="w-full md:w-auto text-white font-bold hover:bg-destructive-foreground"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-white" />
                    Sign Out
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Dialog
        open={isChangePasswordModalOpen}
        onOpenChange={setIsChangePasswordModalOpen}
      >
        <DialogContent className="bg-card max-w-[95%] lg:max-w-[30%] md:max-w-[50%] rounded-xl">
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
                authProvider={currentUser.authProvider || 'email'}
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
        <DialogContent className="bg-card focus:outline-none focus-visible:outline-none focus-visible:ring-0 rounded-xl max-w-[95%] lg:max-w-[30%] md:max-w-[50%]">
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
                authProvider={currentUser.authProvider || 'email'}
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
            <div className="w-full flex flex-col items-center justify-center">
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
          )}
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Modal */}
      <Dialog
        open={isDisable2FAModalOpen}
        onOpenChange={setIsDisable2FAModalOpen}
      >
        <DialogContent className="bg-card focus:outline-none focus-visible:outline-none focus-visible:ring-0 rounded-xl max-w-[95%] lg:max-w-[30%] md:max-w-[50%]">
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {authStep === 'emailPassword' &&
                'Confirm your identity to disable 2FA on your account.'}
              {authStep === 'totp' &&
                'Enter your 2FA verification code to continue.'}
              {authStep === 'action' &&
                'Are you sure you want to disable two-factor authentication? This will make your account less secure.'}
            </DialogDescription>
          </DialogHeader>

          {authStep === 'emailPassword' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <SignInReauthForm
                email={currentUser.emails[0]?.email || ''}
                authProvider={currentUser.authProvider || 'email'}
                onSuccess={handleEmailPasswordSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'totp' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <TOTPVerificationReauthForm
                onSuccess={handleTOTPSuccessForDisable2FA}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'action' && (
            <div className="space-y-4 p-2">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">Warning</span>
                </div>
                <p className="text-sm text-amber-700">
                  Disabling two-factor authentication will remove an important
                  security layer from your account. You will only need your
                  password to sign in, making your account more vulnerable to
                  unauthorized access.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={isSubmitting}
                  className="font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Disabling...</span>
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
                    'Disable 2FA'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enable 2FA Modal */}
      <Dialog
        open={isEnable2FAModalOpen}
        onOpenChange={setIsEnable2FAModalOpen}
      >
        <DialogContent className="bg-card focus:outline-none focus-visible:outline-none focus-visible:ring-0 rounded-xl max-w-[95%] lg:max-w-[30%] md:max-w-[50%]">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {authStep === 'emailPassword' &&
                'Confirm your identity to enable 2FA on your account.'}
              {authStep === 'totp' &&
                'Enter your 2FA verification code to continue.'}
              {authStep === 'action' &&
                'Set up two-factor authentication to add an extra layer of security to your account.'}
            </DialogDescription>
          </DialogHeader>

          {authStep === 'emailPassword' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <SignInReauthForm
                email={currentUser.emails[0]?.email || ''}
                authProvider={currentUser.authProvider || 'email'}
                onSuccess={handleEmailPasswordSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'totp' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <TOTPVerificationReauthForm
                onSuccess={() => setAuthStep('action')}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'action' && (
            <div className="w-full flex flex-col items-center justify-center">
              <TOTPRegistrationReauthForm
                onSuccess={handleTOTPSuccessForEnable2FA}
                onCancel={handleCloseModal}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Email Modal */}
      <Dialog
        open={isVerifyEmailModalOpen}
        onOpenChange={setIsVerifyEmailModalOpen}
      >
        <DialogContent className="bg-card max-w-[95%] lg:max-w-[30%] md:max-w-[50%] rounded-xl">
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

      {/* High-risk action modal */}
      <Dialog
        open={isHighRiskActionModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            // First close the modal, then reset the state
            setTimeout(() => {
              setPendingHighRiskAction(null);
              setAuthStep('emailPassword');
              setNewEmail('');
              setEmailError('');

              // Clean up sessionStorage when modal is closed
              try {
                sessionStorage.removeItem('postOAuthState');
                sessionStorage.removeItem('pendingHighRiskAction');
              } catch (error) {
                console.warn('Failed to clean up sessionStorage:', error);
              }
            }, 300); // Wait until the close animation is complete
            setIsHighRiskActionModalOpen(false);
          }
        }}
      >
        <DialogContent className="bg-card max-w-[95%] lg:max-w-[30%] md:max-w-[50%] rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {pendingHighRiskAction?.type === 'setPrimary'
                ? 'Set Primary Email'
                : pendingHighRiskAction?.type === 'removeEmail'
                  ? 'Remove Email Address'
                  : 'Add Email Address'}
            </DialogTitle>
            <DialogDescription>
              {authStep === 'emailPassword' &&
                'Confirm your identity to continue with this action.'}
              {authStep === 'totp' &&
                'Enter your 2FA verification code to continue.'}
              {authStep === 'action' &&
                pendingHighRiskAction?.type === 'addEmail' &&
                'Enter a new email address to add to your account.'}
              {authStep === 'action' &&
                pendingHighRiskAction?.type === 'setPrimary' &&
                'Are you sure you want to set this email as your primary email address?'}
              {authStep === 'action' &&
                pendingHighRiskAction?.type === 'removeEmail' &&
                'Are you sure you want to remove this email address from your account?'}
            </DialogDescription>
          </DialogHeader>

          {authStep === 'emailPassword' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <SignInReauthForm
                email={currentUser.emails[0]?.email || ''}
                authProvider={currentUser.authProvider || 'email'}
                onSuccess={handleEmailPasswordSuccess}
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'totp' && (
            <div className="w-full -mx-2 -mt-2 px-2 overflow-hidden scale-[0.95] origin-top">
              <TOTPVerificationReauthForm
                onSuccess={
                  pendingHighRiskAction?.type === 'addEmail'
                    ? () => setAuthStep('action')
                    : handleTOTPSuccessForHighRiskAction
                }
                onCancel={handleCloseModal}
              />
            </div>
          )}

          {authStep === 'action' &&
            pendingHighRiskAction?.type === 'addEmail' && (
              <div className="w-full px-2">
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
                      <span className="text-xs text-destructive">
                        {emailError}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddEmail}
                    disabled={isSubmitting || !newEmail.trim()}
                    className="text-white"
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
                </div>
              </div>
            )}

          {authStep === 'action' &&
            pendingHighRiskAction?.type === 'setPrimary' && (
              <div className="w-full px-2">
                <div className="space-y-4 py-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>{pendingHighRiskAction.email}</strong> will become
                      your primary email address. This email will be used for
                      account recovery and important notifications.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCompleteHighRiskAction}
                    disabled={isSubmitting}
                    className="text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Setting...</span>
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
                      'Set as Primary'
                    )}
                  </Button>
                </div>
              </div>
            )}

          {authStep === 'action' &&
            pendingHighRiskAction?.type === 'removeEmail' && (
              <div className="w-full px-2">
                <div className="space-y-4 py-2">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold text-amber-800">
                        Warning
                      </span>
                    </div>
                    <p className="text-sm text-amber-700">
                      <strong>{pendingHighRiskAction.email}</strong> will be
                      permanently removed from your account. You will no longer
                      be able to use this email address for account access or
                      recovery.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCompleteHighRiskAction}
                    disabled={isSubmitting}
                    className="font-semibold"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Removing...</span>
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
                      'Remove Email'
                    )}
                  </Button>
                </div>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { AccountPage };
