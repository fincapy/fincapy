'use client';

import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { usePathname } from 'next/navigation';
import { ModeToggle } from '@/components/mode-toggle';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Fragment } from 'react';
import { ChatWidget } from '@/components/chat-widget';
import {
  ScrollAreaWithPulldown,
  ScrollBarWithPulldown,
} from '@/components/ui/scroll-area-with-pulldown';
import { PlanContext } from './planContext';
import { useState } from 'react';
import { Plan } from '@/backend/domain/plan';
import { Category } from '@/backend/domain/category';
import { Subcategory } from '@/backend/domain/subcategory';
import { StartDateContext, EndDateContext } from './datesContext';
import { UsersContext } from './usersContext';
import { PlaidItemsContext } from './plaidItemsContext';
import { PageContext } from './pageContext';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import {
  HandCoins,
  PiggyBank,
  Landmark,
  Users,
  UserRound,
  Table,
  CircleDollarSign,
  CreditCard,
  LogOut,
  CalendarIcon,
} from 'lucide-react';
import { parse, format } from 'date-fns';
import {
  planAtom,
  plaidItemsAtom,
  usersAtom,
  currentUserIdAtom,
  currentUserRoleAtom,
  nonceAtom,
  currentUserAtom,
  billingStatusAtom,
  transactionSearchQueryAtom,
} from '../state/atoms';
import { useAtom } from 'jotai';
import { useSetAtom } from 'jotai';
import { useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStandalone } from '@/hooks/use-standalone';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import React from 'react';
import { useCallback, useContext } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
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
import { createCategory } from '../category-dashboard/serverActions';
import { v4 as uuidv4 } from 'uuid';
import { TypeContext } from '../category-dashboard/typeContext';
import SubmitButton from '../SubmitButton';
import {
  ColorSelector,
  getRandomColor,
} from '../category-dashboard/ColorSelector';
import {
  IconSelector,
  getRandomIcon,
} from '../category-dashboard/IconSelector';
import { PlusIcon } from 'lucide-react';
import { createTransaction } from '../transactions-dashboard/serverActions';
import { transactionTypes } from '@/backend/domain/transaction';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// define TapButton to require a quick tap on mobile
const TapButton = React.memo(({ onTap, children, className, ...rest }) => {
  const isMobile = useIsMobile();
  const startTimeRef = useRef(0);
  const movedRef = useRef(false);
  const threshold = 300; // ms threshold for tap vs press-and-hold
  const handleTouchStart = () => {
    startTimeRef.current = performance.now();
    movedRef.current = false;
  };
  const handleTouchMove = () => {
    movedRef.current = true;
  };
  const handleTouchEnd = () => {
    const duration = performance.now() - startTimeRef.current;
    if (!movedRef.current && duration < threshold) {
      onTap();
    }
  };
  if (isMobile) {
    return (
      <button
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`${className} select-none`}
        style={{
          touchAction: 'manipulation',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
        }}
        {...rest}
      >
        {children}
      </button>
    );
  }
  return (
    <button onClick={onTap} className={className} {...rest}>
      {children}
    </button>
  );
});

TapButton.displayName = 'TapButton';

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
              'w-[135px] text-md flex items-center shadow-none hover:text-amber-300 hover:border-amber-300 bg-emerald-700 border-white text-white',
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
              'w-[135px] text-md flex items-center shadow-none hover:text-amber-300 hover:border-amber-300 bg-emerald-700 border-white text-white',
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

const TransactionSearchBar = () => {
  const [query, setQuery] = useAtom(transactionSearchQueryAtom);

  return (
    <Input
      placeholder="Search transactions"
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="h-9 w-full bg-emerald-900 text-white placeholder:text-gray-300 rounded-md border-emerald-900 mb-3"
    />
  );
};

const AccountDropdown = React.memo(({ userRole, setPage, page }) => {
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? '' : 'group-hover:text-amber-600';
  const setPageCookie = useCallback((page) => {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    document.cookie = `page=${page}; expires=${expires.toUTCString()}; path=/app`;
  }, []);

  const changePage = useCallback(
    (page) => {
      setPage(page);
      setPageCookie(page);
    },
    [setPage, setPageCookie]
  );

  return (
    <TapButton
      onTap={() => changePage('account')}
      className="flex flex-col items-center gap-[0px] group outline-none"
    >
      <UserRound
        size={25}
        className={
          page === 'account' ||
          page === 'manage-users' ||
          page === 'financial-institutions'
            ? 'text-amber-600 -mb-[2px]'
            : `text-gray-500 ${hoverClass} -mb-[2px]`
        }
      />
      <span
        className={
          page === 'account' ||
          page === 'manage-users' ||
          page === 'financial-institutions'
            ? 'text-[13px] font-bold text-amber-600 select-none'
            : `text-[13px] font-bold text-gray-500 ${hoverClass} select-none`
        }
      >
        Account
      </span>
    </TapButton>
  );
});

AccountDropdown.displayName = 'AccountDropdown';

const NavBar = React.memo(({ page, setPage, userRole }) => {
  const setPageCookie = useCallback((page) => {
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);
    document.cookie = `page=${page}; expires=${expires.toUTCString()}; path=/app`;
  }, []);

  const changePage = useCallback(
    (page) => {
      setPage(page);
      setPageCookie(page);
    },
    [setPage, setPageCookie]
  );

  const isStandalone = useStandalone();
  const isMobile = useIsMobile();
  const hoverClass = isMobile ? '' : 'group-hover:text-amber-600';

  return (
    <div
      className={`flex flex-col items-center justify-center bg-card z-20 w-full gap-1 fixed m-0 touch-none h-[10%] select-none shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] bottom-0`}
    >
      <div className="flex flex-row justify-center items-start lg:w-[33.33%] md:w-[50%] w-[95%] select-none h-full mt-1">
        <div className="flex flex-row justify-between items-center flex-1">
          <TapButton
            onTap={() => changePage('spending')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <HandCoins
              size={25}
              className={
                page === 'spending'
                  ? 'text-amber-600 -mb-[2px]'
                  : `text-gray-500 ${hoverClass} -mb-[2px]`
              }
            />
            <span
              className={
                page === 'spending'
                  ? 'text-[13px] font-bold text-amber-600 select-none'
                  : `text-[13px] font-bold text-gray-500 ${hoverClass} select-none`
              }
            >
              Spending
            </span>
          </TapButton>
          <TapButton
            onTap={() => changePage('income')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <CircleDollarSign
              size={25}
              className={
                page === 'income'
                  ? 'text-amber-600 -mb-[2px]'
                  : `text-gray-500 ${hoverClass} -mb-[2px]`
              }
            />
            <span
              className={
                page === 'income'
                  ? 'text-[13px] font-bold text-amber-600 select-none'
                  : `text-[13px] font-bold text-gray-500 ${hoverClass} select-none`
              }
            >
              Income
            </span>
          </TapButton>
          <TapButton
            onTap={() => changePage('savings')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <PiggyBank
              size={25}
              className={
                page === 'savings'
                  ? 'text-amber-600 -mb-[2px]'
                  : `text-gray-500 ${hoverClass} -mb-[2px]`
              }
            />
            <span
              className={
                page === 'savings'
                  ? 'text-[13px] font-bold text-amber-600 select-none'
                  : `text-[13px] font-bold text-gray-500 ${hoverClass} select-none`
              }
            >
              Savings
            </span>
          </TapButton>
          <TapButton
            onTap={() => changePage('transactions')}
            className="flex flex-col items-center gap-[0px] group"
          >
            <Table
              size={25}
              className={
                page === 'transactions'
                  ? 'text-amber-600 -mb-[2px]'
                  : `text-gray-500 ${hoverClass} -mb-[2px]`
              }
            />
            <span
              className={
                page === 'transactions'
                  ? 'text-[13px] font-bold text-amber-600 select-none'
                  : `text-[13px] font-bold text-gray-500 ${hoverClass} select-none`
              }
            >
              Transactions
            </span>
          </TapButton>
          <AccountDropdown userRole={userRole} setPage={setPage} page={page} />
        </div>
      </div>
    </div>
  );
});

NavBar.displayName = 'NavBar';

function toLocalISO(date) {
  const offsetMs = date.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
  const localTime = new Date(date - offsetMs);
  return localTime.toISOString().slice(0, 19); // Remove 'Z' to avoid UTC indication
}

const createCategoryFormSchema = z.object({
  name: z
    .string()
    .min(1, {
      message: 'Name must be at least 1 character.',
    })
    .max(20, {
      message: 'Name must be less than 20 characters.',
    }),
  monthlyGoal: z.string().regex(/^[\d$,]+$/, {
    message: 'Enter a number between 0 and 1000000000',
  }),
  color: z.string().optional(),
  icon: z.string().optional(),
});

const CreateCategoryForm = ({ setDialogOpen }) => {
  const [planState, setPlanState] = useAtom(planAtom);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const { toast } = useToast();
  const type = useContext(TypeContext);
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlyGoal: null,
      color: getRandomColor(),
      icon: getRandomIcon(),
    },
  });

  function handleCategoryCreation({
    name,
    categoryId,
    otherSubcategoryId,
    monthlyGoal,
    color,
    icon,
    oldPlan,
    setPlanState,
    values,
    onSubmit,
    setDialogOpen,
  }) {
    setTimeout(async () => {
      try {
        const result = await createCategory({
          name,
          categoryId,
          otherSubcategoryId,
          monthlyGoal,
          color,
          icon,
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
    const color = values.color;
    const icon = values.icon;
    const categoryId = uuidv4();
    const otherSubcategoryId = categoryId + '_other';
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    const newCurrentUser = { ...currentUser };
    newCurrentUser.categoryColors = {
      ...newCurrentUser.categoryColors,
      [categoryId]: color,
    };
    newPlan.addCategory({
      categoryId,
      name,
      monthlyGoal,
      type,
      isImmutable: false,
      otherSubcategoryId,
      icon,
    });
    setCurrentUser(newCurrentUser);
    setPlanState(newPlan);
    setDialogOpen(false);
    handleCategoryCreation({
      name,
      categoryId,
      otherSubcategoryId,
      monthlyGoal,
      oldPlan,
      setPlanState,
      values,
      color,
      icon,
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
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <ColorSelector value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Icon</FormLabel>
              <FormControl>
                <IconSelector value={field.value} onChange={field.onChange} />
              </FormControl>
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

const CreateCategoryDialogue = () => {
  const type = useContext(TypeContext);
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant={'outline'}
          className="bg-card shadow-none hover:text-amber-300 hover:border-amber-300 bg-emerald-700 border-white text-white"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PlusIcon size={20} />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] rounded-xl bg-card"
        onPointerDown={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>{`Create ${type[0].toUpperCase() + type.slice(1)} Category`}</DialogTitle>
          <DialogDescription>
            {`Add a new custom ${type} category`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CreateCategoryForm setDialogOpen={setDialogOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TransactionCategorySelector = ({ field }) => {
  const [plan] = useAtom(planAtom);
  const categoryNames = useMemo(() => {
    if (!plan) return [];

    const newCategoryNames = [];
    plan.categories.forEach((category) => {
      newCategoryNames.push({
        name: category.name,
        id: category.categoryId,
      });
      category.subcategories.forEach((subcategory) => {
        newCategoryNames.push({
          name: `${category.name} - ${subcategory.name}`,
          id: subcategory.subcategoryId,
        });
      });
    });

    newCategoryNames.sort((a, b) => a.name.localeCompare(b.name));

    return newCategoryNames;
  }, [plan]);

  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder="None" />
        </SelectTrigger>
      </FormControl>
      <SelectContent className="bg-card">
        {categoryNames.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const createTransactionFormSchema = z.object({
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

const DatePickerFormField = ({ form, name, label }) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full pl-3 text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value ? (
                    format(parse(field.value, 'yyyy-MM-dd', new Date()), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-card z-[9999]"
              align="start"
            >
              <Calendar
                mode="single"
                selected={
                  field.value
                    ? parse(field.value, 'yyyy-MM-dd', new Date())
                    : undefined
                }
                onSelect={(date) => {
                  field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                }}
                disabled={false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const CreateTransactionForm = ({ setDialogOpen }) => {
  const { toast } = useToast();
  const [planState, setPlanState] = useAtom(planAtom);
  const form = useForm({
    resolver: zodResolver(createTransactionFormSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
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
        <DatePickerFormField form={form} name="date" label="Transaction Date" />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <Input
                type="text"
                placeholder="Your Description"
                autoComplete="off"
                {...field}
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
                <SelectContent className="bg-card">
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
                <SelectContent className="bg-card">
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
              <TransactionCategorySelector field={field} />
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
                placeholder="0.00"
                {...field}
                autoComplete="off"
              />
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
  const [dialogOpen, setDialogOpen] = useState(false);
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant={'outline'}
          className="bg-card shadow-none hover:text-amber-300 hover:border-amber-300 bg-emerald-700 border-white text-white"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95%] lg:max-w-[30%] md:max-w-[50%] bg-card rounded-xl">
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

export default function DashboardLayout({
  children,
  userEmail,
  userRole,
  plan,
  userId,
  currentUser,
  users,
  plaidItems,
  pageParam,
  billingStatus,
  nonce,
}) {
  const firstRender = useRef(true);
  const searchParams = useSearchParams();

  // Check for page parameter in URL and determine initial page
  const getInitialPage = () => {
    // First check URL search params (takes precedence)
    const pageFromUrl = searchParams.get('page');
    if (pageFromUrl) {
      return pageFromUrl;
    }

    // Fall back to pageParam prop or default
    return pageParam || 'spending';
  };

  const newPlan = useMemo(
    () =>
      new Plan({
        ...plan,
        categories: plan.categories.map((category) => {
          return new Category({
            ...category,
            subcategories: category.subcategories.map((subcategory) => {
              return new Subcategory({ ...subcategory });
            }),
          });
        }),
      }),
    [plan]
  );
  // get starting date of current month
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0); // Set time to 00:00:00.000
  // get ending date of current month
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(0);
  endDate.setHours(23, 59, 59, 999); // Set time to 23:59:59.999
  newPlan.startDate = startDate;
  newPlan.endDate = endDate;

  const setPlanState = useSetAtom(planAtom);
  const setPlaidItemsState = useSetAtom(plaidItemsAtom);
  const setUsersState = useSetAtom(usersAtom);
  const setCurrentUser = useSetAtom(currentUserAtom);
  const [startDateState, setStartDateState] = useState(
    toLocalISO(startDate).split('T')[0]
  );
  const [endDateState, setEndDateState] = useState(
    toLocalISO(endDate).split('T')[0]
  );
  const setCurrentUserId = useSetAtom(currentUserIdAtom);
  const setCurrentUserRole = useSetAtom(currentUserRoleAtom);
  const [page, setPage] = useState(getInitialPage());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [triggerRefresh, setTriggerRefresh] = useState(false);
  const previousDates = useRef({
    startDate: startDateState,
    endDate: endDateState,
  });
  const setNonce = useSetAtom(nonceAtom);
  const setBillingStatus = useSetAtom(billingStatusAtom);

  // Clean up URL parameters after processing them
  useEffect(() => {
    const authParam = searchParams.get('auth');
    const pageParam = searchParams.get('page');

    if (authParam || pageParam) {
      // Clean up URL parameters
      const url = new URL(window.location);
      url.searchParams.delete('auth');
      url.searchParams.delete('page');
      window.history.replaceState({}, '', url);
    }
  }, [searchParams]); // Run once on mount

  useEffect(() => {
    const getPlan = async () => {
      const res = await fetch(
        `/api/plan?startDate=${startDateState}&endDate=${endDateState}&planId=initial`
      );
      const plan = await res.json();
      const newPlan = new Plan({
        ...plan,
        startDate: parse(startDateState, 'yyyy-MM-dd', new Date()),
        endDate: parse(endDateState, 'yyyy-MM-dd', new Date()),
        categories: plan.categories.map((category) => {
          return new Category({
            ...category,
            subcategories: category.subcategories.map((subcategory) => {
              return new Subcategory({ ...subcategory });
            }),
          });
        }),
      });
      setPlanState(newPlan);
    };

    const execute = async () => {
      if (firstRender.current) {
        firstRender.current = false;
        setPlanState(newPlan);
        setPlaidItemsState(plaidItems);
        setUsersState(users);
        setCurrentUser(currentUser);
        setCurrentUserId(userId);
        setCurrentUserRole(userRole);
        setNonce(nonce);
        setBillingStatus(billingStatus);
      } else {
        if (
          startDateState === previousDates.current.startDate &&
          endDateState === previousDates.current.endDate
        ) {
          setIsRefreshing(true);
        }
        const getPlanTime = performance.now();
        await getPlan();
        const getPlanTimeEnd = performance.now();
        const plannedWaitTime = Math.max(
          0,
          300 - (getPlanTimeEnd - getPlanTime)
        );
        await new Promise((resolve) => setTimeout(resolve, plannedWaitTime));
        setIsRefreshing(false);
        previousDates.current = {
          startDate: startDateState,
          endDate: endDateState,
        };
      }
    };

    execute();
  }, [
    startDateState,
    endDateState,
    triggerRefresh,
    billingStatus,
    currentUser,
    newPlan,
    nonce,
    plaidItems,
    setBillingStatus,
    setCurrentUser,
    setCurrentUserId,
    setCurrentUserRole,
    setNonce,
    setPlaidItemsState,
    setPlanState,
    setUsersState,
    userId,
    userRole,
    users,
  ]);

  const scrollAreaRef = useRef(null);

  const handleScrollAreaFocus = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.focus();
    }
  };

  const pageTitles = {
    'manage-users': 'Manage Users',
    'financial-institutions': 'Financial Institutions',
  };
  const title = page.charAt(0).toUpperCase() + page.slice(1);
  const displayTitle = pageTitles[page] || title;

  const showDatePickers =
    page !== 'account' &&
    page !== 'manage-users' &&
    page !== 'financial-institutions';

  const showCreateCategoryButton =
    (page === 'spending' || page === 'income') && userRole !== 'viewer';

  const showCreateTransactionButton =
    page === 'transactions' && userRole !== 'viewer';

  const showHeaderControls =
    showCreateCategoryButton || showCreateTransactionButton;

  const showTransactionSearch = page === 'transactions';

  const showControlsContainer =
    showDatePickers || showHeaderControls || showTransactionSearch;

  return (
    <StartDateContext.Provider value={{ startDateState, setStartDateState }}>
      <EndDateContext.Provider value={{ endDateState, setEndDateState }}>
        <PageContext.Provider value={{ page, setPage }}>
          <main
            className="w-full h-full overflow-hidden fixed inset-0 touch-none pt-safe pl-safe pr-safe"
            onTouchStart={handleScrollAreaFocus}
            onMouseDown={handleScrollAreaFocus}
          >
            <div
              className={`top-0 fixed w-full flex items-center justify-center bg-emerald-700 z-10 ${
                showDatePickers
                  ? showTransactionSearch
                    ? 'flex-col gap-2 h-[21.4%]'
                    : 'flex-col gap-2 h-[15.1%]'
                  : 'h-[6%]'
              } border-b border-emerald-700`}
            >
              <h1 className="text-lg font-bold text-white select-none">
                {displayTitle}
              </h1>
              {showControlsContainer && (
                <div className="flex flex-col w-[95%] lg:max-w-[1152.5px] gap-2">
                  <div
                    className={`flex items-center w-full ${
                      showHeaderControls ? 'justify-between' : 'justify-start'
                    }`}
                  >
                    {showDatePickers && <DatePickers />}
                    <div className="flex items-center gap-2">
                      {showCreateCategoryButton && (
                        <TypeContext.Provider value={page}>
                          <CreateCategoryDialogue />
                        </TypeContext.Provider>
                      )}
                      {showCreateTransactionButton && (
                        <CreateTransactionDialogue />
                      )}
                    </div>
                  </div>
                  {!showTransactionSearch && (
                    <div className="h-[6px] bg-emerald-700" />
                  )}
                  {showTransactionSearch && <TransactionSearchBar />}
                </div>
              )}
            </div>
            <ScrollAreaWithPulldown
              className={`w-full fixed ${
                showDatePickers
                  ? showTransactionSearch
                    ? 'h-[68.6%]'
                    : 'h-[74.9%]'
                  : 'h-[84%]'
              }`}
              ref={scrollAreaRef}
              onTouchStart={handleScrollAreaFocus}
              triggerRefresh={() => {
                setTriggerRefresh(!triggerRefresh);
              }}
              isRefreshing={isRefreshing}
              style={{
                top: showDatePickers
                  ? showTransactionSearch
                    ? '21.4%'
                    : '15.1%'
                  : '6%',
              }}
            >
              {children}
            </ScrollAreaWithPulldown>
            <NavBar page={page} setPage={setPage} userRole={userRole} />
          </main>
        </PageContext.Provider>
      </EndDateContext.Provider>
    </StartDateContext.Provider>
  );
}
