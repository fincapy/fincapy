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
import { Dialog, DialogContent } from '../ui/dialog';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContext } from 'react';
import { CategoryNamesContext } from '../category-dashboard/categoryNamesContext';
import { TransactionContext } from './transaction';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '../ui/toast';
import { useAtom, useAtomValue } from 'jotai';
import {
  planAtom,
  categoryNamesAtom,
  currentUserRoleAtom,
} from '../state/atoms';
import { Input } from '@/components/ui/input';
import { transactionTypes } from '@/backend/domain/transaction';
import { editTransaction } from '@/components/transaction-table/serverActions';
import SubmitButton from '@/components/SubmitButton';

export function SelectDemo({ field }) {
  const categoryNames = useAtomValue(categoryNamesAtom);

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {categoryNames.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

const recategorizeFormSchema = z.object({
  category: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Enter a date in the format YYYY-MM-DD',
  }),
  description: z
    .string()
    .min(1, {
      message: 'Description must be at least 1 character.',
    })
    .max(100, {
      message: 'Description should be less than 100 characters',
    }),
  status: z.string(),
  type: z.string(),
  amount: z.union([
    z.number().refine((value) => /^\d+(\.\d{1,2})?$/.test(value.toString()), {
      message: 'Must be a valid currency format (up to two decimal places)',
    }),
    z
      .string()
      .regex(
        /^\d+(\.\d{1,2})?$/,
        'Must be a valid currency format (up to two decimal places)'
      ),
  ]),
});

const EditTransactionForm = ({
  transaction,
  transactionId,
  setOuterDialogIsOpen,
  setInnerDialogIsOpen,
}) => {
  const { toast } = useToast();
  const [planState, setPlanState] = useAtom(planAtom);
  const form = useForm({
    resolver: zodResolver(recategorizeFormSchema),
    defaultValues: {
      category: transaction.categoryId,
      date: transaction.date,
      description: transaction.description,
      status: transaction.status,
      type: transaction.type,
      amount: transaction.amount,
    },
  });

  const handleServerEditTransaction = ({
    oldPlanState,
    onSubmit,
    values,
    transactionId,
  }) => {
    setTimeout(async () => {
      try {
        const result = await editTransaction({
          transactionId,
          planId: 'initial',
          newCategoryId: values.category,
          categoryId: transaction.categoryId,
          subcategoryId: transaction.subcategoryId,
          date: values.date,
          description: values.description,
          status: values.status,
          type: values.type,
          amount: parseFloat(values.amount, 10),
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
                onClick={() => {
                  onSubmit(values);
                }}
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
            <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };

  const onSubmit = async (values) => {
    const oldPlanState = planState.clone();
    const newPlanState = planState.clone();
    newPlanState.editTransaction({
      transactionId,
      newCategoryId: values.category,
      categoryId: transaction.categoryId,
      subcategoryId: transaction.subcategoryId,
      date: values.date,
      description: values.description,
      status: values.status,
      type: values.type,
      amount: parseFloat(values.amount, 10),
    });
    setPlanState(newPlanState);
    handleServerEditTransaction({
      oldPlanState: oldPlanState,
      onSubmit,
      values,
      transactionId,
      planId: 'initial',
      newCategoryId: values.category,
    });
    setInnerDialogIsOpen(false);
    setOuterDialogIsOpen(false);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3 h-full"
      >
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <Input
                type="text"
                autoComplete="off"
                {...field}
                defaultValue={field.value}
              />
              <FormMessage />
            </FormItem>
          )}
        ></FormField>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <Input
                type="text"
                autoComplete="off"
                {...field}
                defaultValue={field.value}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PENDING">PENDING</SelectItem>
                  <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <SelectDemo field={field} />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <Input
                type="text"
                {...field}
                autoComplete="off"
                defaultValue={field.value}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton>Save</SubmitButton>
      </form>
    </Form>
  );
};

const EditTransactionDialog = ({ row, setOuterDialogIsOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const transactions = useContext(TransactionContext);
  const transactionId = transactions[row.id].transactionId;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-11/12"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <EditTransactionForm
          transaction={row.original}
          transactionId={transactionId}
          setOuterDialogIsOpen={setOuterDialogIsOpen}
          setInnerDialogIsOpen={setIsOpen}
        />
      </DialogContent>
      <DropdownMenuItem
        className="cursor-pointer"
        onSelect={(e) => {
          e.preventDefault(); // Prevent dropdown from closing
          setIsOpen(true);
        }}
      >
        Edit
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
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {currentUserRole !== 'viewer' && (
          <>
            <DropdownMenuSeparator />
            <EditTransactionDialog row={row} setOuterDialogIsOpen={setIsOpen} />
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
    show: false,
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

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <Actions row={row} />;
    },
  },
];
