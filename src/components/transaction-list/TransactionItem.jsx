import React from 'react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { iconOptions } from '../category-dashboard/IconSelector';
import { colorOptions } from '../category-dashboard/ColorSelector';

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
    <div
      className={cn('flex items-center justify-between p-4', {
        'text-gray-400': isNoImpact,
      })}
    >
      <div className="flex items-center">
        <Icon className={`mr-3 h-6 w-6 ${color.text}`} />
        <div className="flex flex-col">
          <span className="font-medium">{transaction.description}</span>
          <span className="text-sm text-gray-500">
            {format(
              parse(transaction.date, 'yyyy-MM-dd', new Date()),
              'MMM d, yyyy'
            )}
          </span>
        </div>
      </div>
      <div className="flex items-center">
        <span
          className={cn('font-semibold', {
            'text-emerald-700': isPositive,
          })}
        >
          {isPositive ? `+${amount}` : amount}
        </span>
        {isNoImpact && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 ml-2 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{noImpactReason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;
