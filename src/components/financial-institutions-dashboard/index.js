'use client';

import { useState, useEffect } from 'react';
import {
  fetchLinkToken,
  createPlaidItem,
  updatePlaidItem,
  deletePlaidItem,
} from './serverActions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  CircleCheck,
  Trash2,
  CircleAlert,
  RotateCwIcon,
  Landmark,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import React from 'react';
import Script from 'next/script';
import { PlaidItemsContext } from '../dashboard-layout/plaidItemsContext';
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import {
  plaidItemsAtom,
  isLoadingAtom,
  nonceAtom,
  plaidItemDisplayNamesAtom,
  currentUserIdAtom,
  billingStatusAtom,
} from '../state/atoms';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { PaywallOverlay } from '../ui/paywall-overlay';
import { v4 as uuidv4 } from 'uuid';

const DeletePlaidItemDialogue = ({
  institutionId,
  institutionName,
  plaidItemId,
}) => {
  const [plaidItemsState, setPlaidItemsState] = useAtom(plaidItemsAtom);
  const { toast } = useToast();
  const handleServerDeletePlaidItem = ({ oldPlaidItemsState }) => {
    setTimeout(async () => {
      try {
        const result = await deletePlaidItem({
          plaidItemId,
        });
        if (!result) {
          setPlaidItemsState(oldPlaidItemsState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction altText="Try again" onClick={() => onClick()}>
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setPlaidItemsState(oldPlaidItemsState);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
          action: (
            <ToastAction altText="Try again" onClick={() => onClick()}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };

  const onClick = async () => {
    const oldPlaidItemsState = [...plaidItemsState];
    const newPlaidItemsState = plaidItemsState.filter(
      (plaidItem) => plaidItem.plaidItemId !== plaidItemId
    );
    setPlaidItemsState(newPlaidItemsState);
    handleServerDeletePlaidItem({
      institutionId,
      oldPlaidItemsState,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-red-100 hover:bg-red-200 text-red-700 border-red-200 focus:ring-2 focus:ring-red-300 transition-colors"
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]">
        <DialogHeader>
          <DialogTitle>{`Delete ${institutionName}`}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this institution? No more
            transactions will be automatically imported for this institution.
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="destructive"
          className="bg-destructive hover:bg-destructive-foreground text-white"
          onClick={onClick}
        >
          Delete
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const ExistingFinancialInstitutionCard = ({ link, name }) => {
  const [isLinking, setIsLinking] = useState(false);
  const [plaidItemsState, setPlaidItemsState] = useAtom(plaidItemsAtom);
  const { toast } = useToast();
  const handleServerUpdatePlaidItem = (
    publicToken,
    metadata,
    oldPlaidItemsState
  ) => {
    setTimeout(async () => {
      try {
        const result = await updatePlaidItem({
          publicToken,
          plaidItemId: link.plaidItemId,
          institutionId: metadata.institution.institution_id,
        });
        if (!result) {
          setPlaidItemsState(oldPlaidItemsState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction
                altText="Try again"
                onClick={() => onSuccess(publicToken, metadata)}
              >
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setPlaidItemsState(oldPlaidItemsState);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
          action: (
            <ToastAction
              altText="Try again"
              onClick={() => onSuccess(publicToken, metadata)}
            >
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };

  const onSuccess = async (public_token, metadata) => {
    const oldPlaidItemsState = plaidItemsState.map((plaidItem) => ({
      ...plaidItem,
    }));
    const newPlaidItemsState = plaidItemsState.map((plaidItem) => ({
      ...plaidItem,
    }));
    const plaidItem = newPlaidItemsState.find(
      (plaidItem) =>
        plaidItem.institutionId === metadata.institution.institution_id
    );
    plaidItem.status = 'active';
    setPlaidItemsState(newPlaidItemsState);
    handleServerUpdatePlaidItem(public_token, metadata, oldPlaidItemsState);
  };

  const handleLink = async ({ institutionId }) => {
    const linkToken = await fetchLinkToken({ institutionId });
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess,
    });
    handler.open();
  };

  const handleLinkClick = async () => {
    setIsLinking(true);
    try {
      await handleLink({ institutionId: link.institutionId });
    } finally {
      setIsLinking(false);
    }
  };

  // Modern visually appealing card
  return (
    <div
      className="w-full bg-background rounded-xl border border-border shadow-md hover:shadow-lg transition-shadow flex flex-col sm:flex-row items-start sm:items-center px-4 sm:px-6 py-4 gap-4 group"
      style={{ minHeight: '88px' }}
    >
      {/* Left: name, status */}
      <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
        <div className="flex items-center min-w-0 flex-wrap gap-x-2 gap-y-1 flex-1">
          <span className="font-semibold text-base sm:text-lg break-words max-w-full">
            {name}
          </span>
          {link.status === 'active' ? (
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium whitespace-nowrap">
              Active
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium whitespace-nowrap">
              Expired
            </span>
          )}
          {link.status !== 'active' && (
            <span className="text-xs text-red-500 ml-2 whitespace-nowrap">
              Re-link required
            </span>
          )}
        </div>
      </div>
      {/* Right: Actions */}
      <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 focus:ring-2 focus:ring-blue-300 transition-colors"
                onClick={handleLinkClick}
                aria-label="Relink"
              >
                <RotateCwIcon className={isLinking ? 'animate-spin' : ''} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Relink Institution</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-red-100 hover:bg-red-200 text-red-700 border-red-200 focus:ring-2 focus:ring-red-300 transition-colors"
                  aria-label="Delete"
                  // The DeletePlaidItemDialogue handles the click
                  asChild
                >
                  <DeletePlaidItemDialogue
                    institutionId={link.institutionId}
                    institutionName={link.institutionName}
                    plaidItemId={link.plaidItemId}
                  />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Remove Institution</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

const NewFinancialInstitutionCard = ({ currentUserId }) => {
  const { toast } = useToast();
  const [isLinking, setIsLinking] = useState(false);
  const [plaidItemsState, setPlaidItemsState] = useAtom(plaidItemsAtom);
  const handleServerCreatePlaidItem = (
    publicToken,
    metadata,
    oldPlaidItemsState,
    plaidItemId
  ) => {
    setTimeout(async () => {
      try {
        const result = await createPlaidItem({
          publicToken,
          plaidItemId,
          institutionId: metadata.institution.institution_id,
          institutionName: metadata.institution.name,
        });
        if (!result) {
          setPlaidItemsState(oldPlaidItemsState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction
                altText="Try again"
                onClick={() => onSuccess(publicToken, metadata)}
              >
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setPlaidItemsState(oldPlaidItemsState);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
          action: (
            <ToastAction
              altText="Try again"
              onClick={() => onSuccess(publicToken, metadata)}
            >
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };

  const onSuccess = async (public_token, metadata) => {
    const oldPlaidItemsState = [...plaidItemsState];
    const newPlaidItemId = uuidv4();
    const newPlaidItemsState = [
      ...oldPlaidItemsState,
      {
        plaidItemId: newPlaidItemId,
        userId: currentUserId,
        institutionId: metadata.institution.institution_id,
        institutionName: metadata.institution.name,
        status: 'active',
      },
    ];
    setPlaidItemsState(newPlaidItemsState);
    handleServerCreatePlaidItem(
      public_token,
      metadata,
      oldPlaidItemsState,
      newPlaidItemId
    );
  };

  const handleLink = async ({ institutionId }) => {
    const linkToken = await fetchLinkToken({ institutionId });
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess,
    });
    handler.open();
  };

  const handleLinkClick = async () => {
    setIsLinking(true);
    try {
      await handleLink({ institutionId: null });
    } finally {
      setIsLinking(false);
    }
  };

  return (
    <React.Fragment>
      {isLinking ? (
        <div className="w-full min-h-[88px] flex items-center rounded-xl justify-center border-dashed border-2 border-border bg-card hover:bg-background">
          <RotateCwIcon size={18} className="animate-spin" />
        </div>
      ) : (
        <Button
          className="w-full min-h-[88px] flex items-center rounded-xl justify-center border-dashed border-2 border-border bg-card hover:bg-background"
          variant="outline"
          onClick={handleLinkClick}
        >
          <PlusIcon size={48} />
        </Button>
      )}
    </React.Fragment>
  );
};

export default function FinancialInstitutionsDashboard() {
  const [plaidItemsState, setPlaidItemsState] = useAtom(plaidItemsAtom);
  const [plaidItemDisplayNames, setPlaidItemDisplayNames] = useAtom(
    plaidItemDisplayNamesAtom
  );
  const [currentUserId, setCurrentUserId] = useAtom(currentUserIdAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [nonce, setNonce] = useAtom(nonceAtom);
  const billingStatus = useAtomValue(billingStatusAtom);

  useEffect(() => {
    if (plaidItemsState) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [plaidItemsState, setIsLoading]);

  return (
    <div className="flex w-full flex-col h-full">
      <div className="max-w-6xl w-[95%] mx-auto relative">
        {/* Dashboard Header */}
        <div className="flex flex-col items-center justify-center mb-2">
          <Landmark className="h-12 w-12 text-primary mb-2" />
          <h2 className="text-2xl font-bold mb-1">Financial Institutions</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Link your bank and financial accounts to securely import
            transactions. All connections are encrypted and powered by Plaid.
          </p>
        </div>
        <Script
          nonce={nonce}
          src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
          strategy="afterInteractive"
          onLoad={() => {
            console.log('Plaid script loaded successfully.');
          }}
          onError={(error) => {
            console.error('Error loading Plaid script:', error);
          }}
        />
        {/* Section Card for Institutions */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-md mt-6 w-full relative">
          {billingStatus === 'free' && (
            <PaywallOverlay
              title="Connect Financial Accounts"
              description="Upgrade to a paid plan to connect unlimited financial institutions and automatically import transactions."
            />
          )}
          <div className="flex items-center gap-4 mb-4">
            <Landmark className="h-8 w-8 text-primary" />
            <span className="text-lg font-semibold">Linked Institutions</span>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton
                    className="h-40 w-full bg-card rounded-xl border border-border"
                    key={index}
                  />
                ))}
              </>
            ) : (
              <>
                {plaidItemsState.map((plaidItem) => (
                  <ExistingFinancialInstitutionCard
                    key={plaidItem.institutionId}
                    link={plaidItem}
                    name={plaidItemDisplayNames[plaidItem.plaidItemId]}
                  />
                ))}
                {/* Add new institution button - directly use the component */}
                <NewFinancialInstitutionCard
                  key="new-financial-institution-card"
                  currentUserId={currentUserId}
                />
              </>
            )}
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Your linked institutions are used to import transactions securely.
          </div>
        </div>
        <div className="mt-6 text-sm text-muted-foreground text-center max-w-md mx-auto">
          Your financial data is encrypted and securely processed via Plaid. We
          never store your bank credentials.
        </div>
      </div>
    </div>
  );
}
