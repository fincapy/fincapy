import React, { useState } from 'react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Info } from 'lucide-react';
import { iconOptions } from '../category-dashboard/IconSelector';
import { colorOptions } from '../category-dashboard/ColorSelector';
import EditTransactionDialog from '../edit-transaction-dialog';
import { useIsMobile } from '@/hooks/use-mobile';

const NoImpactInfo = ({ reason }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleInteraction = (e) => {
    e.stopPropagation();
    if (isMobile) {
      setIsOpen(true);
    }
  };

  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="p-2 -m-2 cursor-pointer" onClick={handleInteraction}>
            <Info className="h-5 w-5 ml-2 text-amber-600" />
          </div>
        </DialogTrigger>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => e.stopPropagation()}
          className="rounded-xl w-[95%] lg:max-w-[1152.5px]"
        >
          <DialogHeader>
            <DialogTitle>Why no budget impact?</DialogTitle>
          </DialogHeader>
          <DialogDescription>{reason}</DialogDescription>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          asChild
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="p-2 -m-2 cursor-pointer">
            <Info className="h-5 w-5 ml-2 text-amber-600" />
          </div>
        </TooltipTrigger>
        <TooltipContent
          className="bg-amber-100 text-amber-900 max-w-[250px] sm:max-w-xs p-2 rounded-md shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm">{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const TransactionItem = ({ transaction }) => {
  const isNoImpact =
    transaction.status === 'PENDING' ||
    ['credit_card_payment', 'transfer'].includes(transaction.type);

  const isPositive = ['refund', 'income'].includes(transaction.type);

  const noImpactReason =
    transaction.status === 'PENDING'
      ? "This transaction is pending and won't affect your budget until it clears."
      : "This is a transfer between your accounts and doesn't change your overall budget.";

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(transaction.amount));

  const Icon = iconOptions[transaction.icon] || iconOptions.badgeHelp;
  const color = colorOptions[transaction.color] || colorOptions.amber;

  return (
    <EditTransactionDialog transaction={transaction}>
      <div
        className={cn('flex items-center justify-between p-4 cursor-pointer', {
          'text-gray-400': isNoImpact,
        })}
      >
        <div className="flex items-center flex-1 min-w-0">
          <Icon
            className={cn('mr-3 h-6 w-6 flex-shrink-0', {
              [color.text]: !isNoImpact,
              'text-gray-400': isNoImpact,
            })}
          />
          <div className="flex flex-col min-w-0">
            <span className="font-medium break-words">
              {transaction.description}
            </span>
            <span className="text-sm text-gray-500">
              {format(
                parse(transaction.date, 'yyyy-MM-dd', new Date()),
                'MMM d, yyyy'
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 ml-4">
          <span
            className={cn('font-semibold', {
              'text-emerald-700': isPositive && !isNoImpact,
              'text-gray-400': isNoImpact,
            })}
          >
            {isPositive ? `+${amount}` : amount}
          </span>
          {isNoImpact && <NoImpactInfo reason={noImpactReason} />}
        </div>
      </div>
    </EditTransactionDialog>
  );
};

export default TransactionItem;
