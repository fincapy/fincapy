'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ChevronDown, Eye, Grip, Pen, Trash2 } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { PlusIcon } from 'lucide-react';
import { Progress } from '../ui/progress';
import TransactionTable from '../transaction-table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { forwardRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { createTransaction } from './serverActions';
import { v4 as uuidv4 } from 'uuid';
import { useRef, useEffect } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CategoryNamesContext } from './categoryNamesContext';
import {
  CategoryContext,
  deleteSubcategoryState,
  createCategoryState,
} from './categoryContext';
import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TypeContext } from './typeContext';
import { useContext } from 'react';
import {
  StartDateContext,
  EndDateContext,
} from '../dashboard-layout/datesContext';
import { useAtom, useAtomValue } from 'jotai';
import { planAtom, isLoadingAtom } from '../state/atoms';
import {
  transactionsViewAtom,
  categoryNamesAtom,
  currentUserRoleAtom,
} from '../state/atoms';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactionTypes } from '@/backend/domain/transaction';
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

const CreateTransactionForm = ({ setDialogOpen }) => {
  const { toast } = useToast();
  const [planState, setPlanState] = useAtom(planAtom);
  const form = useForm({
    resolver: zodResolver(recategorizeFormSchema),
    defaultValues: {
      description: 'Your Description',
      date: new Date().toISOString().split('T')[0],
      status: 'COMPLETED',
      type: 'spending',
      amount: 0.0,
    },
  });

  const handleServerCreateTransaction = ({
    oldPlanState,
    onSubmit,
    values,
    transactionId,
  }) => {
    setTimeout(async () => {
      try {
        const result = await createTransaction({
          planId: 'initial',
          categoryId: values.category,
          date: values.date,
          description: values.description,
          status: values.status,
          type: values.type,
          amount: parseFloat(values.amount, 10),
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
    const transactionId = uuidv4();
    newPlanState.createTransaction({
      categoryId: values.category,
      date: values.date,
      description: values.description,
      status: values.status,
      type: values.type,
      amount: parseFloat(values.amount, 10),
      transactionId,
    });
    setPlanState(newPlanState);
    setDialogOpen(false);
    handleServerCreateTransaction({
      oldPlanState: oldPlanState,
      onSubmit,
      values,
      transactionId,
      planId: 'initial',
      newCategoryId: values.category,
    });
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
              <FormLabel>Transaction Date</FormLabel>
              <Input type="text" autoComplete="off" {...field} />
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
              <Input type="text" autoComplete="off" {...field} />
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
              <Input type="text" {...field} autoComplete="off" />
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <SubmitButton>Create</SubmitButton>
        </DialogClose>
      </form>
    </Form>
  );
};

const CreateTransactionDialogue = () => {
  const type = useContext(TypeContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="bg-card"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] bg-card"
        onPointerDown={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Create Transaction</DialogTitle>
          <DialogDescription>Add a new custom transaction</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CreateTransactionForm setDialogOpen={setDialogOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DatePickers = () => {
  const { startDateState, setStartDateState } = useContext(StartDateContext);
  const { endDateState, setEndDateState } = useContext(EndDateContext);
  const startDate = parse(startDateState, 'yyyy-MM-dd', new Date());
  const endDate = parse(endDateState, 'yyyy-MM-dd', new Date());

  const setStartDate = (date) => {
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (parsedDate <= endDate) {
      setStartDateState(date);
    } else {
      alert('Start date cannot be after the end date.');
    }
  };

  const setEndDate = (date) => {
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (parsedDate >= startDate) {
      setEndDateState(date);
    } else {
      alert('End date cannot be before the start date.');
    }
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 items-center h-[37.73px]">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'min-w-28 flex items-center bg-card',
              !startDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon />
            {startDate ? (
              format(startDate, 'LLL dd, y')
            ) : (
              <span>Start Date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => {
              if (date) {
                setStartDate(date.toISOString().split('T')[0]);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'min-w-28 flex items-center bg-card',
              !endDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon />
            {endDate ? format(endDate, 'LLL dd, y') : <span>End Date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => {
              if (date) {
                setEndDate(date.toISOString().split('T')[0]);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

const TransactionsDashboard = () => {
  const [transactions, setTransactions] = useAtom(transactionsViewAtom);
  const [currentUserRole, setCurrentUserRole] = useAtom(currentUserRoleAtom);

  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  useEffect(() => {
    if (transactions) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transactions]);

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col w-full flex-grow gap-4 mt-2 mb-2">
          <div className="flex flex-col justify-center items-center gap-2">
            <div
              className="flex flex-row justify-between gap-4 w-11/12"
              key="create-category-dialogue-skeleton"
            >
              <div className="flex flex-row flex-wrap gap-2 items-center">
                <Skeleton className="h-9 w-[138.62px] bg-card" />
                <Skeleton className="h-9 w-[138.62px] bg-card" />
              </div>
              <Skeleton className="h-9 w-9 bg-card" />
            </div>
            <Skeleton className="h-[70vh] w-11/12 bg-card" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full gap-4 mb-2 mt-2">
          <div className="flex flex-col justify-center items-center gap-2 flex-shrink">
            <div
              className="flex flex-row justify-between gap-4 w-11/12"
              key="create-transaction-dialogue"
            >
              <DatePickers />
              {currentUserRole !== 'viewer' && <CreateTransactionDialogue />}
            </div>
            <div
              className="grid w-11/12 h-[70vh] bg-card"
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <TransactionTable transactions={transactions} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { TransactionsDashboard };
