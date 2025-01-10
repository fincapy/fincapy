'use client';

import { useState, useEffect } from 'react';
import {
  fetchLinkToken,
  exchangePublicToken,
  refreshLink,
} from './serverActions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PlusIcon,
  CircleCheck,
  Trash2Icon,
  CircleAlert,
  RotateCwIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

const ExistingFinancialInstitutionCard = ({ link, handleConnect }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await handleConnect({ institutionId: link.id });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card className="w-11/12 lg:w-3/4 min-h-40 rounded-none flex items-center justify-center relative">
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
                  This institution's link has expired. Please re-link to
                  continue ingesting transactions.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardHeader>
      <CardContent>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-0 rounded-none"
        >
          <Trash2Icon />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-0 right-9 rounded-none"
          onClick={handleRefresh}
        >
          <RotateCwIcon className={isRefreshing ? 'animate-spin' : ''} />
        </Button>
      </CardContent>
    </Card>
  );
};

const NewFinancialInstitutionCard = ({ handleConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectClick = async () => {
    setIsConnecting(true);
    try {
      await handleConnect({ institutionId: null });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <React.Fragment>
      {isConnecting ? (
        <div className="w-11/12 lg:w-3/4 min-h-40 rounded-none flex items-center justify-center border-dashed border-2 hover:bg-background">
          <RotateCwIcon size={18} className="animate-spin" />
        </div>
      ) : (
        <Button
          className="w-11/12 lg:w-3/4 min-h-40 rounded-none flex items-center justify-center border-dashed border-2 hover:bg-background"
          variant="outline"
          onClick={handleConnectClick}
        >
          <PlusIcon size={48} />
        </Button>
      )}
    </React.Fragment>
  );
};

export default function FinancialInstitutionsDashboard({ links }) {
  useEffect(() => {
    // Load Plaid script when component mounts
    const script = document.createElement('script');
    script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const onSuccess = async (public_token, metadata) => {
    await exchangePublicToken({
      publicToken: public_token,
      institutionId: metadata.institution.institution_id,
      institutionName: metadata.institution.name,
    });
  };

  const handleConnect = async ({ institutionId }) => {
    const linkToken = await fetchLinkToken({ institutionId });
    const handler = window.Plaid.create({
      token: linkToken,
      onSuccess,
    });
    handler.open();
  };

  return (
    <div className="flex flex-col w-full flex-grow gap-4 mt-4 mb-28 justify-center items-center">
      {links.map((link) => (
        <ExistingFinancialInstitutionCard
          key={link.institutionId}
          link={link}
          handleConnect={handleConnect}
        />
      ))}
      <NewFinancialInstitutionCard
        key="new-financial-institution-card"
        handleConnect={handleConnect}
      />
    </div>
  );
}
