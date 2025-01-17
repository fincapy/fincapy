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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../ui/dialog';
import { useState } from 'react';
import {
  Form,
  FormControl,
  FormDescription,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useContext } from 'react';
import { CategoryNamesContext } from '../category-dashboard/categoryNamesContext';
import { TransactionContext } from './transaction';
import { recategorizeTransaction } from './serverActions';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '../ui/toast';
import { useAtom } from 'jotai';
import { planAtom } from '../state/atoms';

export function SelectDemo({ field }) {
  const categories = useContext(CategoryNamesContext);

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="Category" />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {categories.map((category) => (
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
});

const RecategorizeForm = ({
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
    },
  });

  const handleServerRecategorizeTransaction = ({
    oldPlanState,
    onSubmit,
    values,
    transactionId,
  }) => {
    setTimeout(async () => {
      try {
        const result = await recategorizeTransaction({
          transactionId,
          planId: 'initial',
          newCategoryId: values.category,
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
    newPlanState.recategorizeTransaction({
      transactionId,
      newCategoryId: values.category,
    });
    setPlanState(newPlanState);
    await handleServerRecategorizeTransaction({
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
        className="flex flex-col gap-3"
      >
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
        <DialogClose asChild>
          <Button type="submit">Create</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const RecategorizeDialog = ({ row, setOuterDialogIsOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const transactions = useContext(TransactionContext);
  const transactionId = transactions[row.id].transactionId;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-11/12">
        <RecategorizeForm
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
        Recategorize
      </DropdownMenuItem>
    </Dialog>
  );
};

const Actions = ({ row }) => {
  const [isOpen, setIsOpen] = useState(false);

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
        <DropdownMenuSeparator />
        <RecategorizeDialog row={row} setOuterDialogIsOpen={setIsOpen} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns = [
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
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
