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
import { useContext } from 'react';

const DeletePlaidItemDialogue = ({ institutionId, institutionName }) => {
  const onClick = async () => {
    await deletePlaidItem({ institutionId });
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

const ExistingFinancialInstitutionCard = ({ link }) => {
  const [isLinking, setIsLinking] = useState(false);

  const onSuccess = async (public_token, metadata) => {
    await updatePlaidItem({
      publicToken: public_token,
      institutionId: metadata.institution.institution_id,
    });
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

  return (
    <Card className="w-11/12 lg:w-3/4 min-h-40 flex items-center justify-center relative">
      <CardHeader className="flex flex-row items-center justify-center gap-2">
        <CardTitle>{link.institutionName}</CardTitle>
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

const NewFinancialInstitutionCard = () => {
  const [isLinking, setIsLinking] = useState(false);

  const onSuccess = async (public_token, metadata) => {
    await createPlaidItem({
      publicToken: public_token,
      institutionId: metadata.institution.institution_id,
      institutionName: metadata.institution.name,
    });
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
  const { plaidItemsState } = useContext(PlaidItemsContext);
  return (
    <div className="flex flex-col w-full flex-grow gap-4 mt-4 mb-8 justify-center items-center">
      <Script
        src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"
        strategy="beforeInteractive"
      />
      {plaidItemsState.map((plaidItem) => (
        <ExistingFinancialInstitutionCard
          key={plaidItem.institutionId}
          link={plaidItem}
        />
      ))}
      <NewFinancialInstitutionCard key="new-financial-institution-card" />
    </div>
  );
}
