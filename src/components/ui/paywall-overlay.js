'use client';

import { LockIcon, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Button } from './button';
import { billingStatusAtom } from '../state/atoms';
import { useAtomValue } from 'jotai';

export const PaywallOverlay = ({ title, description, children }) => {
  const billingStatus = useAtomValue(billingStatusAtom);
  const isFree = billingStatus === 'free';

  if (!isFree) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-40" aria-hidden={true}>
        {children}
      </div>
      <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-sm bg-black/40 overflow-hidden rounded-lg">
        <div className="bg-card p-6 rounded-xl border border-border shadow-xl text-center flex flex-col items-center gap-4 max-w-[95%] lg:max-w-md">
          <div className="p-3 rounded-full bg-amber-100 text-amber-700">
            <LockIcon className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-bold">{title || 'Premium Feature'}</h3>
          <p className="text-muted-foreground">
            {description ||
              'This feature is available on paid plans only. Upgrade to unlock this feature and more.'}
          </p>
          <Link href="/upgrade">
            <Button className="font-semibold mt-2 flex items-center gap-2 bg-primary border border-amber-600 hover:bg-amber-600 text-gray-900">
              Upgrade Now <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
