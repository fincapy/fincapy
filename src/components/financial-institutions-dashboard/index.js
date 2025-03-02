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
import { useAtom, useSetAtom } from 'jotai';
import { plaidItemsAtom, isLoadingAtom } from '../state/atoms';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usersAtom,
  plaidItemDisplayNamesAtom,
  currentUserIdAtom,
} from '../state/atoms';
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
        <Button variant="ghost" size="icon" className="rounded-lg">
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
        <Button variant="destructive" onClick={onClick}>
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

  console.log('link', link);

  return (
    <Card className="w-11/12 min-h-40 flex items-center justify-center relative">
      <CardHeader className="flex flex-row items-center justify-center gap-2">
        <CardTitle>{name}</CardTitle>
        {link.status === 'active' ? (
          <CircleCheck color="green" style={{ marginTop: '0px' }} />
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger style={{ marginTop: '0px' }}>
                <CircleAlert color="red" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  This institution&apos;s link has expired. Please re-link to
                  continue ingesting transactions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent className="absolute top-0 right-0">
        <div className="absolute top-0 right-0">
          <DeletePlaidItemDialogue
            institutionId={link.institutionId}
            institutionName={link.institutionName}
            plaidItemId={link.plaidItemId}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-9 rounded-lg"
          onClick={handleLinkClick}
        >
          <RotateCwIcon className={isLinking ? 'animate-spin' : ''} />
        </Button>
      </CardContent>
    </Card>
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
        <div className="w-11/12 min-h-40 flex items-center rounded-lg justify-center border-dashed border-2 hover:bg-background">
          <RotateCwIcon size={18} className="animate-spin" />
        </div>
      ) : (
        <Button
          className="w-11/12 min-h-40 flex items-center rounded-lg justify-center border-dashed border-2 hover:bg-background"
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
  console.log('currentUserId', currentUserId);
  console.log('plaidItemDisplayNames', plaidItemDisplayNames);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  useEffect(() => {
    if (plaidItemsState) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [plaidItemsState]);
  return (
    <div className="flex flex-col w-full flex-grow gap-4 mt-4 mb-8 justify-center items-center">
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Plaid script loaded successfully.');
        }}
        onError={(error) => {
          console.error('Error loading Plaid script:', error);
        }}
      />
      {isLoading ? (
        <>
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton className="h-40 w-11/12 bg-card" key={index} />
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
          <NewFinancialInstitutionCard
            key="new-financial-institution-card"
            currentUserId={currentUserId}
          />
        </>
      )}
    </div>
  );
}
