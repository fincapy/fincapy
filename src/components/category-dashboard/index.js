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
import { ProgressCategory } from '@/components/ui/progress-category';
import { ProgressSubcategory } from '@/components/ui/progress-subcategory';
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
import { planAtom } from '../state/atoms';
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
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Category Name" {...field} />
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
      >
        <DialogHeader>
          <DialogTitle>{`Create ${type[0].toUpperCase() + type.slice(1)} Category`}</DialogTitle>
          <DialogDescription>
            {`Add a new custom ${type} category`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CreateCategoryForm />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeleteCategoryDialogue = ({ categoryId }) => {
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();
  const handleServerDeleteCategory = ({
    categoryId,
    planId,
    setPlanState,
    oldPlan,
    onClick,
  }) => {
    setTimeout(async () => {
      try {
        const result = await deleteCategory({ categoryId, planId });
        if (!result) {
          setPlanState(oldPlan);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction altText="Try again" onClick={() => onClick()}>
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
          action: (
            <ToastAction altText="Try again" onClick={() => onClick()}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };
  const onClick = async () => {
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    newPlan.deleteCategory({ categoryId });
    setPlanState(newPlan);
    handleServerDeleteCategory({
      categoryId,
      planId: 'initial',
      setPlanState,
      oldPlan,
      onClick,
    });
  };
  const type = useContext(TypeContext);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]">
        <DialogHeader>
          <DialogTitle>{`Delete ${type[0].toUpperCase() + type.slice(1)} Category`}</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? All transactions
            associated with this category will be moved to uncategorized.
          </DialogDescription>
        </DialogHeader>
        <Button
          variant="destructive"
          onClick={onClick}
          onPointerDown={(e) => e.stopPropagation()}
        >
          Delete
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const EditCategoryForm = ({ categoryName, monthlyGoal, categoryId }) => {
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: categoryName,
      monthlyGoal: monthlyGoal.toString(),
    },
  });

  const handleServerUpdateCategory = ({
    name,
    categoryId,
    monthlyGoal,
    planId,
    setPlanState,
    oldPlan,
    onSubmit,
    values,
  }) => {
    setTimeout(async () => {
      try {
        const result = await updateCategory({
          name,
          categoryId,
          monthlyGoal,
          planId,
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
          action: (
            <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };

  async function onSubmit(values) {
    const monthlyGoal = parseInt(
      values.monthlyGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    newPlan.updateCategory({ categoryId, name, monthlyGoal });
    setPlanState(newPlan);
    handleServerUpdateCategory({
      name,
      categoryId,
      monthlyGoal,
      planId: 'initial',
      setPlanState,
      oldPlan,
      onSubmit,
      values,
    });
  }

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '' || value === '$')
      return '';
    let numericValue = null;
    if (typeof value === 'string') {
      numericValue = value.replace(/[^0-9]/g, '');
    } else {
      numericValue = value;
    }
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
                  autoComplete="off"
                  placeholder="Category Name"
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
                  autoComplete="off"
                  placeholder="$0"
                  {...field}
                  value={formatValue(field.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <Button type="submit" onPointerDown={(e) => e.stopPropagation()}>
            Submit
          </Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const EditCategoryDialogue = ({ categoryName, monthlyGoal, categoryId }) => {
  const type = useContext(TypeContext);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{`Edit ${type[0].toUpperCase() + type.slice(1)} Category`}</DialogTitle>
          <DialogDescription>
            {`Edit your existing ${type} category`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <EditCategoryForm
            categoryName={categoryName}
            monthlyGoal={monthlyGoal}
            categoryId={categoryId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CreateSubcategoryForm = ({ categoryId, setDropdownIsOpen }) => {
  const type = useContext(TypeContext);
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlyGoal: '',
    },
  });

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '' || value === '$')
      return '';
    let numericValue = null;
    if (typeof value === 'string') {
      numericValue = value.replace(/[^0-9]/g, '');
    } else {
      numericValue = value;
    }
    return `$${new Intl.NumberFormat('en-US').format(Number(numericValue))}`;
  };

  function handleServerSubcategoryCreation({
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
        const result = await createSubcategory({
          name,
          categoryId,
          monthlyGoal,
          planId: 'initial',
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
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    const category = newPlan.categories.find(
      (category) => category.categoryId === categoryId
    );
    category.createSubcategory({ name, monthlyGoal, isImmutable: false });
    setPlanState(newPlan);
    handleServerSubcategoryCreation({
      name,
      categoryId,
      monthlyGoal,
      oldPlan,
      setPlanState,
      values,
      onSubmit,
    });
    setDropdownIsOpen(true);
  }

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
                  autoComplete="off"
                  placeholder="Category Name"
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
                  autoComplete="off"
                  placeholder="$0"
                  {...field}
                  value={formatValue(field.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <Button type="submit">Submit</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const CreateSubcategoryDialogue = ({ categoryId, setDropdownIsOpen }) => {
  const type = useContext(TypeContext);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          style={{
            marginRight: '-24px',
            marginTop: '-32px',
          }}
          className="rounded-lg"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Subcategory</DialogTitle>
          <DialogDescription>
            {`Create a new subcategory for your ${type} category`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CreateSubcategoryForm
            categoryId={categoryId}
            setDropdownIsOpen={setDropdownIsOpen}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditSubcategoryForm = ({ subcategoryId, categoryId }) => {
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlyGoal: '',
    },
  });

  const formatValue = (value) => {
    if (value === null || value === undefined || value === '' || value === '$')
      return '';
    let numericValue = null;
    if (typeof value === 'string') {
      numericValue = value.replace(/[^0-9]/g, '');
    } else {
      numericValue = value;
    }
    return `$${new Intl.NumberFormat('en-US').format(Number(numericValue))}`;
  };

  const handleServerUpdateSubcategory = ({
    name,
    monthlyGoal,
    subcategoryId,
    categoryId,
    planId,
    setPlanState,
    oldPlan,
    onSubmit,
    values,
  }) => {
    setTimeout(async () => {
      try {
        const result = await updateSubcategory({
          name,
          monthlyGoal,
          subcategoryId,
          categoryId,
          planId,
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
          action: (
            <ToastAction altText="Try again" onClick={() => onSubmit(values)}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };

  async function onSubmit(values) {
    const monthlyGoal = parseInt(
      values.monthlyGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    const category = newPlan.categories.find(
      (category) => category.categoryId === categoryId
    );
    category.updateSubcategory({
      subcategoryId,
      name,
      monthlyGoal,
    });
    setPlanState(newPlan);
    handleServerUpdateSubcategory({
      name,
      monthlyGoal,
      subcategoryId,
      categoryId,
      planId: 'initial',
      setPlanState,
      oldPlan,
      onSubmit,
      values,
    });
  }

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
                  autoComplete="off"
                  placeholder="Subcategory Name"
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
              <FormLabel>Monthly Spending Goal</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="$0"
                  {...field}
                  value={formatValue(field.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogClose asChild>
          <Button type="submit">Submit</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const EditSubcategoryDialogue = ({ subcategoryId, categoryId }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Edit Subcategory</DialogTitle>
          <DialogDescription>Edit your existing subcategory</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <EditSubcategoryForm
            subcategoryId={subcategoryId}
            categoryId={categoryId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeleteSubcategoryDialogue = ({ subcategoryId, categoryId }) => {
  const type = useContext(TypeContext);
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();

  const handleServerDeleteSubcategory = ({
    subcategoryId,
    categoryId,
    planId,
    setPlanState,
    oldPlan,
    onClick,
    type,
  }) => {
    setTimeout(async () => {
      try {
        const result = await deleteSubcategory({
          subcategoryId,
          categoryId,
          planId,
          type,
        });
        if (!result) {
          setPlanState(oldPlan);
          toast({
            variant: 'outline',
            title: 'Uh oh! Something went wrong.',
            description: 'There was a problem with your request.',
            action: (
              <ToastAction altText="Try again" onClick={() => onClick()}>
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
          action: (
            <ToastAction altText="Try again" onClick={() => onClick()}>
              Try again
            </ToastAction>
          ),
        });
      }
    }, 0);
  };

  const onClick = async () => {
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    newPlan.deleteSubcategory({ subcategoryId, categoryId, type });
    setPlanState(newPlan);
    handleServerDeleteSubcategory({
      subcategoryId,
      categoryId,
      planId: 'initial',
      setPlanState,
      oldPlan,
      onClick,
      type,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%]">
        <DialogHeader>
          <DialogTitle>Delete Subcategory</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this subcategory?
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button
            variant="destructive"
            onClick={onClick}
            onPointerDown={(e) => e.stopPropagation()}
          >
            Delete
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

const OpenTransactionTableDialogue = ({ transactions, categoryId }) => {
  return (
    <Dialog className="max-w-full max-h-full">
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Eye />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh]"
        id="transaction-modal"
      >
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Transactions</DialogTitle>
            <DialogDescription>
              A list of transactions associated with this category
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <TransactionTable transactions={transactions} categoryId={categoryId} />
      </DialogContent>
    </Dialog>
  );
};

const CategoryCard = ({
  category,
  areSubcategoriesOpen,
  subcategoryLength,
  categoryCardRef,
  isOverlapping,
  setAreSubcategoriesOpen,
  listeners,
  attributes,
  isGrabbing,
  setIsGrabbing,
}) => {
  const getRoundedStyle = () => {
    if (!areSubcategoriesOpen) {
      return 'rounded-xl';
    }

    if (areSubcategoriesOpen && subcategoryLength === 0) {
      return 'rounded-xl';
    }

    if (areSubcategoriesOpen && subcategoryLength > 0 && !isOverlapping) {
      return 'rounded-none rounded-t-xl';
    }

    return 'rounded-none rounded-b-xl';
  };

  const progress = Math.min(
    (category.currentNet / category.proratedGoal) * 100,
    100
  );

  return (
    <Card
      ref={categoryCardRef}
      className={`z-40 shadow-none sticky -top-1 ${getRoundedStyle()}`}
    >
      <CardHeader className="pb-3 pt-4">
        <CardTitle>
          <div className="flex flex-row justify-between items-center -mb-3">
            <div className="flex flex-row items-center gap-2">
              <span>{category.name}</span>
              <div className="flex flex-row gap-0 items-center">
                {!category.isImmutable && (
                  <EditCategoryDialogue
                    categoryName={category.name}
                    monthlyGoal={category.monthlyGoal}
                    categoryId={category.categoryId}
                  />
                )}
                {!category.isImmutable && (
                  <DeleteCategoryDialogue categoryId={category.categoryId} />
                )}
                {category.type === 'savings' ? (
                  <div className="h-9 w-9" />
                ) : (
                  <OpenTransactionTableDialogue
                    transactions={category.transactions}
                    categoryId={category.categoryId}
                  />
                )}
              </div>
            </div>
            <CreateSubcategoryDialogue
              categoryId={category.categoryId}
              setDropdownIsOpen={setAreSubcategoriesOpen}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-row gap-2 items-center">
          <span>$0</span>
          <ProgressCategory value={progress} />
          <span>{`$${category.proratedGoal}`}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col justify-center p-0">
        <div className="flex justify-between w-full">
          <div
            className={`flex flex-row gap-2 items-center ml-1 touch-none select-none cursor-${isGrabbing ? 'grabbing' : 'grab'}`}
            onMouseDown={() => setIsGrabbing(true)}
            onMouseUp={() => setIsGrabbing(false)}
            onTouchStart={() => setIsGrabbing(true)}
            onTouchEnd={() => setIsGrabbing(false)}
            {...listeners}
            {...attributes}
          >
            <Grip />
          </div>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onPointerDown={(e) => e.stopPropagation()}
              className={`transition-transform duration-200 ${
                areSubcategoriesOpen ? 'rotate-180' : ''
              } hover:bg-inherit`}
            >
              <ChevronDown
                className={`transition-transform duration-300 rotate-180`}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
      </CardFooter>
    </Card>
  );
};

const SubcategoryCard = forwardRef(
  ({ subcategory, subcategoryLength, index, category }, ref) => {
    const [isGrabbing, setIsGrabbing] = useState(false);
    const getRoundedStyle = () => {
      if (index === subcategoryLength - 1) {
        return 'rounded-none rounded-b-xl';
      }

      return 'rounded-none';
    };

    const progress = Math.min(
      (subcategory.currentNet / subcategory.proratedGoal) * 100,
      100
    );

    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: subcategory.subcategoryId });

    const style = {
      transform: CSS.Translate.toString(transform),
      transition,
      height: 'auto',
    };

    return (
      <Card
        ref={setNodeRef}
        className={`shadow-none bg-card-subcategory ${getRoundedStyle()} select-none z-10 ${isGrabbing && 'z-30'} relative`}
        style={style}
      >
        <CardHeader className="pb-3 pt-4">
          <CardTitle>
            <div className="flex flex-row items-center gap-2 -mb-3">
              <span>{subcategory.name}</span>
              <div className="flex flex-row gap-0 items-center">
                <EditSubcategoryDialogue
                  subcategoryId={subcategory.subcategoryId}
                  categoryId={category.categoryId}
                />
                <DeleteSubcategoryDialogue
                  subcategoryId={subcategory.subcategoryId}
                  categoryId={category.categoryId}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Eye />
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-row gap-2 items-center">
            <span>$0</span>
            <ProgressCategory value={progress} />
            <span>{`$${subcategory.proratedGoal}`}</span>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col justify-center p-0">
          <div className="flex flex-row justify-between items-center w-full h-[36px]">
            <div
              className={`flex flex-row w-full ml-1 touch-none select-none cursor-${isGrabbing ? 'grabbing' : 'grab'}`}
              onMouseDown={() => setIsGrabbing(true)}
              onMouseUp={() => setIsGrabbing(false)}
              onTouchStart={() => setIsGrabbing(true)}
              onTouchEnd={() => setIsGrabbing(false)}
              {...listeners}
              {...attributes}
            >
              <Grip />
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }
);

const CategoryCardCollapsible = ({ category, subcategories }) => {
  const [areSubcategoriesOpen, setAreSubcategoriesOpen] = useState(false);
  const [isOverlapping, setIsOverlapping] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const categoryCardRef = useRef(null);
  const subcategoryRefs = useRef([
    ...subcategories.map(() => React.createRef()),
  ]);

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.categoryId });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    height: 'auto',
  };

  useEffect(() => {
    // Function to check overlap between category and the first subcategory
    const checkOverlap = () => {
      if (!categoryCardRef.current || subcategoryRefs.current.length === 0)
        return;

      if (areSubcategoriesOpen) {
        const categoryRect = categoryCardRef.current.getBoundingClientRect();
        const firstSubcategoryRef = subcategoryRefs.current[0]?.current;

        if (!firstSubcategoryRef) return;

        const subcategoryRect = firstSubcategoryRef.getBoundingClientRect();

        const isOverlapping = categoryRect.bottom - 20 > subcategoryRect.top;

        setIsOverlapping(isOverlapping);
      }
    };

    const scrollAreaViewport = document.querySelector(
      '[data-radix-scroll-area-viewport]'
    );

    if (scrollAreaViewport) {
      scrollAreaViewport.addEventListener('scroll', checkOverlap);
      window.addEventListener('resize', checkOverlap);

      // Initial check
      checkOverlap();

      // Cleanup listeners on unmount
      return () => {
        scrollAreaViewport.removeEventListener('scroll', checkOverlap);
        window.removeEventListener('resize', checkOverlap);
      };
    }
  }, [categoryCardRef, subcategoryRefs, areSubcategoriesOpen]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const [previousState, setPreviousState] = useState(subcategories);
  const [subcategoriesState, setSubcategoriesState] = useState(subcategories);

  useEffect(() => {
    setSubcategoriesState(subcategories);
  }, [subcategories]);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // If dropped outside or in the same position, do nothing
    if (!over || active.id === over.id) return;

    // Reorder cards
    const oldIndex = subcategoriesState.findIndex(
      (subcategory) => subcategory.subcategoryId === active.id
    );
    const newIndex = subcategoriesState.findIndex(
      (subcategory) => subcategory.subcategoryId === over.id
    );
    setSubcategoriesState((prev) => arrayMove(prev, oldIndex, newIndex));
    await reorderSubcategories({
      planId: 'initial',
      categoryId: category.categoryId,
      oldIndex,
      newIndex,
    });
  };

  return (
    <Collapsible
      open={areSubcategoriesOpen}
      onOpenChange={setAreSubcategoriesOpen}
      ref={setNodeRef}
      style={style}
      className={`${isGrabbing ? 'z-50' : 'z-40'} select-none relative`}
    >
      <CategoryCard
        category={category}
        areSubcategoriesOpen={areSubcategoriesOpen}
        subcategoryLength={subcategoriesState.length}
        categoryCardRef={categoryCardRef}
        isOverlapping={isOverlapping}
        setAreSubcategoriesOpen={setAreSubcategoriesOpen}
        listeners={listeners}
        attributes={attributes}
        isGrabbing={isGrabbing}
        setIsGrabbing={setIsGrabbing}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={subcategoriesState.map(
            (subcategory) => subcategory.subcategoryId
          )}
          strategy={verticalListSortingStrategy}
        >
          {subcategoriesState.map((subcategory, index) => (
            <CollapsibleContent
              key={subcategory.subcategoryId}
              ref={subcategoryRefs.current[index]}
            >
              <SubcategoryCard
                category={category}
                subcategory={subcategory}
                subcategoriesState={subcategoriesState}
                setSubcategoriesState={setSubcategoriesState}
                setPreviousState={setPreviousState}
                setAreSubcategoriesOpen={setAreSubcategoriesOpen}
                areSubcategoriesOpen={areSubcategoriesOpen}
                subcategoryLength={subcategories.length}
                index={index}
              />
            </CollapsibleContent>
          ))}
        </SortableContext>
      </DndContext>
    </Collapsible>
  );
};

const DatePickers = () => {
  const type = useContext(TypeContext);
  const { startDateState, setStartDateState } = useContext(StartDateContext);
  const { endDateState, setEndDateState } = useContext(EndDateContext);
  const startDate = parse(startDateState, 'yyyy-MM-dd', new Date());
  const endDate = parse(endDateState, 'yyyy-MM-dd', new Date());
  const router = useRouter();

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
            onSelect={(date) => setStartDate(date.toISOString().split('T')[0])}
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
            onSelect={(date) => setEndDate(date.toISOString().split('T')[0])}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default function CategoryDashboard({ type, categories }) {
  const { startDateState, setStartDateState } = useContext(StartDateContext);
  const { endDateState, setEndDateState } = useContext(EndDateContext);
  const [categoriesState, setCategoriesState] = useState(categories);
  const [categoryNames, setCategoryNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  useEffect(() => {
    if (categories.length > 0) {
      setCategoriesState(categories);
      setIsLoading(false);
      const newCategoryNames = Object.values(categoriesState)
        .map((category) =>
          category.subcategories.map((subcategory) => {
            return {
              name: `${category.name} - ${subcategory.name}`,
              id: subcategory.subcategoryId,
              transactions: subcategory.transactions,
            };
          })
        )
        .flat();
      Object.values(categoriesState).forEach((category) => {
        newCategoryNames.push({
          name: category.name,
          id: category.categoryId,
          transactions: category.transactions,
        });
      });
      newCategoryNames.sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      setCategoryNames(newCategoryNames);
    }
  }, [categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const [previousState, setPreviousState] = useState(categoriesState);

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    // If dropped outside or in the same position, do nothing
    if (!over || active.id === over.id) return;

    // Reorder cards
    const oldIndex = categoriesState.findIndex(
      (category) => category.categoryId === active.id
    );
    const newIndex = categoriesState.findIndex(
      (category) => category.categoryId === over.id
    );
    setCategoriesState((prev) => arrayMove(prev, oldIndex, newIndex));
    await reorderCategories({
      planId: 'initial',
      type: categoriesState[0].type,
      oldIndex,
      newIndex,
    });
  };

  return (
    <CategoryContext.Provider
      value={{ categoriesState, setCategoriesState, setPreviousState }}
    >
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
              {(type === 'spending' || type === 'income') && (
                <Skeleton className="h-9 w-9 bg-card" />
              )}
            </div>

            {Array.from({ length: 7 }).map((_, index) => (
              <div
                className="flex flex-col w-11/12 shadow-lg rounded-xl"
                key={index}
              >
                <Skeleton className="h-[129.73px] w-full rounded-xl bg-card" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <CategoryNamesContext.Provider value={categoryNames}>
          <TypeContext.Provider value={type}>
            <div className="flex flex-col w-full h-full gap-4 mb-2 mt-2">
              <div className="flex flex-col justify-center items-center gap-2">
                <div
                  className="flex flex-row justify-between gap-4 w-11/12"
                  key="create-category-dialogue"
                >
                  <DatePickers
                    startDate={startDateState}
                    endDate={endDateState}
                  />
                  {(type === 'spending' || type === 'income') && (
                    <CreateCategoryDialogue />
                  )}
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={categoriesState.map(
                      (category) => category.categoryId
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    {categoriesState.map((category) => (
                      <div
                        className="flex flex-col w-11/12 shadow-lg rounded-xl"
                        key={category.categoryId}
                      >
                        <CategoryCardCollapsible
                          key={category.categoryId}
                          id={category.categoryId}
                          category={category}
                          subcategories={category.subcategories}
                        />
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </TypeContext.Provider>
        </CategoryNamesContext.Provider>
      )}
    </CategoryContext.Provider>
  );
}
