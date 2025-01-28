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
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderCategories,
  reorderSubcategories,
} from './serverActions';
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
import { useAtom } from 'jotai';
import { transactionsViewAtom } from '../state/atoms';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

const createCategoryFormSchema = z.object({
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }),
  monthlyGoal: z.string().regex(/^[\d$,]+$/, {
    message: 'Enter a number between 0 and 1000000000',
  }),
});
const CreateCategoryForm = () => {
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();
  const type = useContext(TypeContext);
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlyGoal: null,
    },
  });

  function handleCategoryCreation({
    name,
    categoryId,
    monthlyGoal,
    oldPlan,
    setPlanState,
    values,
    onSubmit,
  }) {
    setTimeout(async () => {
      try {
        const result = await createCategory({
          name,
          categoryId,
          monthlyGoal,
          planId: 'initial',
          type,
        });
        if (!result) {
          setPlanState(oldPlan);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
                Try again
              </ToastAction>
            ),
          });
        }
      } catch (error) {
        setPlanState(oldPlan);
        toast({
          variant: 'outline',
          title: 'Network Error',
          description: 'There was an issue connecting to the server.',
        });
      }
    }, 0);
  }

  async function onSubmit(values) {
    const monthlyGoal = parseInt(
      values.monthlyGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;
    const categoryId = uuidv4();
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    newPlan.addCategory({
      categoryId,
      name,
      monthlyGoal,
      type,
      isImmutable: false,
    });
    setPlanState(newPlan);
    handleCategoryCreation({
      name,
      categoryId,
      monthlyGoal,
      oldPlan,
      setPlanState,
      values,
      onSubmit,
    });
  }

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '' || value === '$')
      return '';
    const numericValue = value.replace(/[^0-9]/g, '');
    return `$${new Intl.NumberFormat('en-US').format(Number(numericValue))}`;
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Category Name"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="monthlyGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Goal</FormLabel>
              <FormControl>
                <Input
                  placeholder="$0"
                  {...field}
                  autoComplete="off"
                  value={formatValue(field.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <Button type="submit" onPointerDown={(e) => e.stopPropagation()}>
            Create
          </Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const CreateCategoryDialogue = () => {
  const type = useContext(TypeContext);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]"
        onPointerDown={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{`Create Category`}</DialogTitle>
          <DialogDescription>{`Add a new custom category`}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CreateCategoryForm />
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
              'min-w-28 flex items-center',
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
        <PopoverContent className="w-auto p-0" align="start">
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
              'min-w-28 flex items-center',
              !endDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon />
            {endDate ? format(endDate, 'LLL dd, y') : <span>End Date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
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

  return (
    <div className="flex flex-col w-full h-full gap-4 mb-2 mt-2">
      <div className="flex flex-col justify-center items-center gap-2 flex-shrink">
        <div
          className="flex flex-row justify-between gap-4 w-11/12"
          key="create-transaction-dialogue"
        >
          <DatePickers />
          <CreateCategoryDialogue />
        </div>
        <div className="grid w-11/12 max-w-11/12 h-[85.5vh]">
          <TransactionTable transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

export { TransactionsDashboard };
