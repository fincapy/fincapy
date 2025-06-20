import { MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DataTableColumnHeader } from './data-table-column-header';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '../ui/toast';
import { useAtom } from 'jotai';
import { planAtom, currentUserRoleAtom } from '../state/atoms';
import { deleteTransaction } from '@/components/transaction-table/serverActions';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { format, parse } from 'date-fns';
import EditTransactionDialog from '../edit-transaction-dialog';

const DeleteTransactionDialog = ({ row, setOuterDialogIsOpen }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [planState, setPlanState] = useAtom(planAtom);
  const transactionId = row.original.transactionId;

  function handleServerDeleteTransaction({
    oldPlanState,
    handleDeleteTransaction,
  }) {
    setTimeout(async () => {
      try {
        const result = await deleteTransaction({
          planId: 'initial',
          transactionId,
        });
        if (!result) {
          setPlanState(oldPlanState);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction
                altText="Try again"
                onClick={() => handleDeleteTransaction()}
              >
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setPlanState(oldPlanState);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
          action: (
            <ToastAction
              altText="Try again"
              onClick={() => handleDeleteTransaction()}
            >
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  }

  const handleDeleteTransaction = async () => {
    const oldPlanState = planState.clone();
    const newPlanState = planState.clone();
    newPlanState.deleteTransaction({ transactionId });
    setPlanState(newPlanState);
    setOuterDialogIsOpen(false);
    setIsOpen(false);
    handleServerDeleteTransaction({
      oldPlanState,
      handleDeleteTransaction,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] bg-card"
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this transaction?
        </DialogDescription>
        <Button
          variant="destructive"
          className="border-none outline-none ring-0 bg-destructive hover:bg-destructive-foreground text-white"
          onClick={handleDeleteTransaction}
        >
          Delete
        </Button>
      </DialogContent>
      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault(); // Prevent dropdown from closing
          setIsOpen(true);
        }}
      >
        Delete
      </DropdownMenuItem>
    </Dialog>
  );
};

const Actions = ({ row }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useAtom(currentUserRoleAtom);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {currentUserRole !== 'viewer' && (
          <>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="p-0"
            >
              <EditTransactionDialog transaction={row.original}>
                <div className="px-2 py-1.5 text-sm w-full">Edit</div>
              </EditTransactionDialog>
            </DropdownMenuItem>
            <DeleteTransactionDialog
              row={row}
              setOuterDialogIsOpen={setIsOpen}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns = [
  {
    accessorKey: 'categoryId',
  },
  {
    accessorKey: 'transactionId',
  },
  {
    accessorKey: 'subcategoryId',
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = parse(row.getValue('date'), 'yyyy-MM-dd', new Date());
      return format(date, 'MMM d, yyyy');
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue('date'));
      const dateB = new Date(rowB.getValue('date'));
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
  },
  {
    accessorKey: 'categoryName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
  },
  {
    accessorKey: 'amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Amount" />
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

      return <div>{formatted}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <Actions row={row} />;
    },
  },
];
