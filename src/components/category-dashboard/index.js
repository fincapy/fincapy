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
import {
  ChevronDown,
  Eye,
  Grip,
  Pen,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Pencil } from 'lucide-react';
import { PlusIcon } from 'lucide-react';
import { Progress } from '../ui/progress';
import TransactionTable from '../transaction-table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { forwardRef, useState, useRef } from 'react';
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
import { useEffect } from 'react';
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
import {
  planAtom,
  isLoadingAtom,
  currentUserRoleAtom,
  currentUserAtom,
} from '../state/atoms';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import SubmitButton from '@/components/SubmitButton';
import { ProgressSubcategory } from '@/components/ui/progress-subcategory';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HelpCircle } from 'lucide-react';
import OnboardingModal from './OnboardingModal';
import { getOnboardingStatus } from './serverActions';
import { Portal } from '@radix-ui/react-portal';
import { ColorSelector, getRandomColor, colorOptions } from './ColorSelector';

const progressBarColors = {
  cyan: { regular: 'bg-cyan-500', muted: 'bg-cyan-500/20' },
  indigo: { regular: 'bg-indigo-500', muted: 'bg-indigo-500/20' },
  green: { regular: 'bg-green-500', muted: 'bg-green-500/20' },
  yellow: { regular: 'bg-yellow-500', muted: 'bg-yellow-500/20' },
  blue: { regular: 'bg-blue-500', muted: 'bg-blue-500/20' },
  purple: { regular: 'bg-purple-500', muted: 'bg-purple-500/20' },
  pink: { regular: 'bg-pink-500', muted: 'bg-pink-500/20' },
  orange: { regular: 'bg-orange-500', muted: 'bg-orange-500/20' },
  teal: { regular: 'bg-teal-500', muted: 'bg-teal-500/20' },
  emerald: { regular: 'bg-emerald-500', muted: 'bg-emerald-500/20' },
  violet: { regular: 'bg-violet-500', muted: 'bg-violet-500/20' },
  fuchsia: { regular: 'bg-fuchsia-500', muted: 'bg-fuchsia-500/20' },
  rose: { regular: 'bg-rose-500', muted: 'bg-rose-500/20' },
  lime: { regular: 'bg-lime-500', muted: 'bg-lime-500/20' },
  amber: { regular: 'bg-amber-500', muted: 'bg-amber-500/20' },
  sky: { regular: 'bg-sky-500', muted: 'bg-sky-500/20' },
};

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
});

const CreateCategoryForm = ({ setDialogOpen }) => {
  const [planState, setPlanState] = useAtom(planAtom);
  const [currentUserRole, setCurrentUserRole] = useAtom(currentUserRoleAtom);
  const { toast } = useToast();
  const type = useContext(TypeContext);
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlyGoal: null,
      color: getRandomColor(),
    },
  });

  function handleCategoryCreation({
    name,
    categoryId,
    otherSubcategoryId,
    monthlyGoal,
    color,
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
    const categoryId = uuidv4();
    const otherSubcategoryId = categoryId + '_other';
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    const newCurrentUser = { ...currentUserRole };
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
    });
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
          variant="outline"
          size="icon"
          className="bg-card hover:bg-card hover:border-primary hover:text-primary text-gray-800"
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
    setDialogOpen(false);
    handleServerDeleteCategory({
      categoryId,
      planId: 'initial',
      setPlanState,
      oldPlan,
      onClick,
    });
  };
  const type = useContext(TypeContext);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const content = (
    <DialogContent
      className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] rounded-xl bg-card"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <DialogHeader>
        <DialogTitle>{`Delete ${type[0].toUpperCase() + type.slice(1)} Category`}</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this category? All transactions
          associated with this category will be moved to uncategorized.
        </DialogDescription>
      </DialogHeader>
      <Button
        variant="destructive"
        className="bg-destructive hover:bg-destructive-foreground text-white"
        onClick={onClick}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Delete
      </Button>
    </DialogContent>
  );

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="h-4 w-4 text-muted-foreground hover:text-foreground mb-[2px] mr-[1px] focus:outline-none focus:ring-0 focus:ring-offset-0 active:bg-transparent touch-none select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleOpenDialog}
            data-action="delete"
            data-context-id={categoryId}
          >
            <Trash2 size={18} className="hover:text-primary" />
          </button>
        </DialogTrigger>
        {content}
      </Dialog>
      {/* Hidden dialog for mobile menu click handling */}
      <button
        className="hidden"
        onClick={handleOpenDialog}
        data-dialog-trigger="delete"
      />
    </>
  );
};

const EditCategoryForm = ({
  categoryName,
  monthlyGoal,
  categoryId,
  color,
  setDialogOpen,
}) => {
  const [planState, setPlanState] = useAtom(planAtom);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: categoryName,
      monthlyGoal: monthlyGoal.toString(),
      color: currentUser.categoryColors[categoryId] || color || 'amber',
    },
  });

  const handleServerUpdateCategory = ({
    name,
    categoryId,
    monthlyGoal,
    color,
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
          color,
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
    const name = values.name || categoryName;
    const color = values.color;
    const oldPlan = planState.clone();
    const newPlan = planState.clone();
    newPlan.updateCategory({ categoryId, name, monthlyGoal, color });
    const newCurrentUser = { ...currentUser };
    newCurrentUser.categoryColors[categoryId] = color;
    setCurrentUser(newCurrentUser);
    setPlanState(newPlan);
    setDialogOpen(false);
    handleServerUpdateCategory({
      name,
      categoryId,
      monthlyGoal,
      color,
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
        {categoryName !== 'Other' ||
          (categoryName !== 'Savings' && (
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
          ))}
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
        <DialogClose asChild>
          <SubmitButton>Save</SubmitButton>
        </DialogClose>
      </form>
    </Form>
  );
};

const EditCategoryDialogue = ({
  categoryName,
  monthlyGoal,
  categoryId,
  color,
}) => {
  const type = useContext(TypeContext);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // Create the component with the props needed
  const content = (
    <DialogContent
      className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] rounded-xl bg-card"
      onOpenAutoFocus={(e) => e.preventDefault()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <DialogHeader>
        <DialogTitle>{`Edit ${type[0].toUpperCase() + type.slice(1)} Category`}</DialogTitle>
        <DialogDescription>
          {`Edit your existing ${type} category`}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <EditCategoryForm
          setDialogOpen={setDialogOpen}
          categoryName={categoryName}
          monthlyGoal={monthlyGoal}
          categoryId={categoryId}
          color={color}
        />
      </div>
    </DialogContent>
  );

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 active:bg-transparent touch-none select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleOpenDialog}
            data-action="edit"
            data-context-id={categoryId}
          >
            <Pencil size={18} className="hover:text-primary" />
          </button>
        </DialogTrigger>
        {content}
      </Dialog>
    </>
  );
};

const CreateSubcategoryForm = ({
  categoryId,
  setDropdownIsOpen,
  setDialogOpen,
}) => {
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
    subcategoryId,
  }) {
    setTimeout(async () => {
      try {
        const result = await createSubcategory({
          name,
          categoryId,
          monthlyGoal,
          planId: 'initial',
          subcategoryId,
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
    const subcategoryId = uuidv4();
    category.createSubcategory({
      name,
      monthlyGoal,
      isImmutable: false,
      subcategoryId,
    });
    setPlanState(newPlan);
    setDialogOpen(false);
    handleServerSubcategoryCreation({
      name,
      categoryId,
      monthlyGoal,
      oldPlan,
      setPlanState,
      values,
      onSubmit,
      subcategoryId,
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
          <SubmitButton>Create</SubmitButton>
        </DialogClose>
      </form>
    </Form>
  );
};

const CreateSubcategoryDialogue = ({ categoryId, setDropdownIsOpen }) => {
  const type = useContext(TypeContext);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <button
          variant=""
          size="icon"
          className="rounded-full"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <PlusIcon size={20} />
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] rounded-xl bg-card"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
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
            setDialogOpen={setDialogOpen}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditSubcategoryForm = ({
  subcategoryId,
  categoryId,
  subcategory,
  setDialogOpen,
}) => {
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: subcategory.name,
      monthlyGoal: subcategory.monthlyGoal.toString(),
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
    setDialogOpen(false);
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
        {!subcategoryId.includes('other') && (
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
        )}
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
          <SubmitButton>Save</SubmitButton>
        </DialogClose>
      </form>
    </Form>
  );
};

const EditSubcategoryDialogue = ({
  subcategoryId,
  categoryId,
  subcategory,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const content = (
    <DialogContent
      className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] rounded-xl bg-card"
      onOpenAutoFocus={(e) => e.preventDefault()}
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <DialogHeader>
        <DialogTitle>Edit Subcategory</DialogTitle>
        <DialogDescription>Edit your existing subcategory</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <EditSubcategoryForm
          setDialogOpen={setDialogOpen}
          subcategory={subcategory}
          subcategoryId={subcategoryId}
          categoryId={categoryId}
        />
      </div>
    </DialogContent>
  );

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 active:bg-transparent touch-none select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleOpenDialog}
            data-action="edit"
            data-context-id={subcategoryId}
          >
            <Pencil size={17} className="hover:text-primary" />
          </button>
        </DialogTrigger>
        {content}
      </Dialog>
    </>
  );
};

const DeleteSubcategoryDialogue = ({ subcategoryId, categoryId }) => {
  const type = useContext(TypeContext);
  const [planState, setPlanState] = useAtom(planAtom);
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

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
    setDialogOpen(false);
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

  const content = (
    <DialogContent
      className="max-w-[90%] lg:max-w-[30%] md:max-w-[50%] rounded-xl bg-card"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <DialogHeader>
        <DialogTitle>Delete Subcategory</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete this subcategory?
        </DialogDescription>
      </DialogHeader>
      <Button
        variant="destructive"
        className="bg-destructive hover:bg-destructive-foreground text-white"
        onClick={onClick}
        onPointerDown={(e) => e.stopPropagation()}
      >
        Delete
      </Button>
    </DialogContent>
  );

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <button
            className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 active:bg-transparent touch-none select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleOpenDialog}
            data-action="delete"
            data-context-id={subcategoryId}
          >
            <Trash2 size={17} className="hover:text-primary" />
          </button>
        </DialogTrigger>
        {content}
      </Dialog>
    </>
  );
};

const OpenTransactionTableDialogue = ({
  transactions,
  eyeSize,
  categoryId,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const content = (
    <DialogContent
      className="max-w-[95vw] max-h-[80vh] bg-card rounded-xl"
      id="transaction-modal"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <DialogHeader>
        <VisuallyHidden>
          <DialogTitle>Transactions</DialogTitle>
          <DialogDescription>
            A list of transactions associated with this category
          </DialogDescription>
        </VisuallyHidden>
      </DialogHeader>
      <div className="grid place-items-center w-full max-h-[70vh]">
        <TransactionTable transactions={transactions} />
      </div>
    </DialogContent>
  );

  return (
    <>
      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        className="max-w-full max-h-full rounded-xl bg-card"
      >
        <DialogTrigger asChild>
          <button
            className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 active:bg-transparent touch-none select-none"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleOpenDialog}
            data-action="view"
            data-context-id={categoryId}
          >
            <Eye size={eyeSize} className="hover:text-primary" />
          </button>
        </DialogTrigger>
        {content}
      </Dialog>
    </>
  );
};

const ActionMenu = ({ children, mobileOnly = false, contextId = '' }) => {
  // Create a mapping of action types to their labels
  const actionLabels = {
    edit: 'Edit',
    delete: 'Delete',
    view: 'View Transactions',
  };

  // Helper function to determine the action type and label from the child component
  const getActionInfo = (child) => {
    if (!child) return null;

    if (
      child.type === EditCategoryDialogue ||
      child.type === EditSubcategoryDialogue
    ) {
      return { type: 'edit', icon: <Pencil size={18} className="mr-2" /> };
    } else if (
      child.type === DeleteCategoryDialogue ||
      child.type === DeleteSubcategoryDialogue
    ) {
      return { type: 'delete', icon: <Trash2 size={18} className="mr-2" /> };
    } else if (child.type === OpenTransactionTableDialogue) {
      return { type: 'view', icon: <Eye size={18} className="mr-2" /> };
    }
    return null;
  };

  // Filter out null/undefined children
  const validChildren = React.Children.toArray(children).filter(
    (child) => child
  );
  const childrenCount = validChildren.length;

  // Create array of dialog states and their setter functions
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Create menu items and separators with proper keys
  const menuItems = [];
  validChildren.forEach((child, index) => {
    const actionInfo = getActionInfo(child);
    const isLastItem = index === childrenCount - 1;

    // Extract the setDialogOpen function from the child if possible
    let openModal = null;
    if (
      React.isValidElement(child) &&
      child.props &&
      typeof child.props.handleOpenDialog === 'function'
    ) {
      openModal = child.props.handleOpenDialog;
    }

    // Add the menu item
    menuItems.push(
      <DropdownMenuItem
        key={`item-${index}`}
        className="cursor-pointer p-3 hover:bg-secondary/50 focus:outline-none focus:bg-transparent active:bg-transparent touch-none select-none rounded-md"
        onSelect={(e) => {
          e.preventDefault();

          // Close the dropdown menu
          setDropdownOpen(false);

          // Set a small timeout to allow the dropdown to close before opening the modal
          setTimeout(() => {
            // If we have access to the child's handleOpenDialog, call it
            if (openModal) {
              openModal();
            } else {
              // Find the specific button with the matching contextId and action type
              const selector = contextId
                ? `[data-action="${actionInfo?.type}"][data-context-id="${contextId}"]`
                : `[data-action="${actionInfo?.type}"]`;

              const button = document.querySelector(selector);
              if (button) {
                button.click();
              }
            }
          }, 10);
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center w-full gap-2">
          {actionInfo?.icon}
          <span className="font-medium text-md">
            {actionInfo?.type ? actionLabels[actionInfo.type] : 'Action'}
          </span>
        </div>
      </DropdownMenuItem>
    );

    // Add separator if not the last item
    if (!isLastItem) {
      menuItems.push(
        <div
          key={`separator-${index}`}
          className="h-[1px] bg-border mx-2 my-1"
        ></div>
      );
    }
  });

  return (
    <>
      {/* Desktop view - show buttons directly */}
      <div
        className={`hidden md:flex flex-row gap-[5px] items-center ${mobileOnly ? 'md:hidden' : ''}`}
      >
        {children}
      </div>

      {/* Mobile view - show kebab menu */}
      <div className="md:hidden flex flex-row justify-end">
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              className="text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 active:bg-transparent touch-none select-none z-50 mb-[2px] -mr-[15px] p-2"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="h-6 w-6 flex items-center justify-center">
                <MoreVertical size={18} className="hover:text-primary" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-card w-[200px] p-2 focus:outline-none select-none"
          >
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hidden components - render them but don't add refs anymore */}
      <div className="hidden">{validChildren}</div>
    </>
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
  color,
  mutedColor,
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

  const [currentUserRole, setCurrentUserRole] = useAtom(currentUserRoleAtom);
  const [currentUser, setCurrentUser] = useAtom(currentUserAtom);

  const progress = Math.min(
    (category.currentNet / category.proratedGoal) * 100,
    100
  );
  category.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  const getProgressPercentage = () => {
    if (category.proratedGoal === 0 && category.currentNet > 0) {
      return 100;
    }

    if (category.proratedGoal === 0 && category.currentNet === 0) {
      return 100;
    }

    if (category.proratedGoal === 0) {
      return 0;
    }

    return (category.currentNet / category.proratedGoal) * 100;
  };

  const progressPercentage = getProgressPercentage();

  return (
    <Card
      ref={categoryCardRef}
      className={`z-40 shadow-none sticky -top-1 ${getRoundedStyle()} h-[130px]`}
    >
      <CardHeader className="p-0">
        <CardTitle>
          <div className="flex flex-row width-full justify-end mt-1 mr-1">
            {currentUserRole !== 'viewer' ? (
              <CreateSubcategoryDialogue
                categoryId={category.categoryId}
                setDropdownIsOpen={setAreSubcategoriesOpen}
              />
            ) : (
              <div className="h-4 w-4" />
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-0 pt-0">
        <div className="flex flex-col gap-0">
          <div className="flex w-full items-center -mb-[5px] md:mb-[2px]">
            <div className="flex flex-row items-center justify-between md:justify-start md:gap-[5px] w-full text-wrap break-words">
              <span className="flex items-center text-lg break-words max-w-[90%] font-bold text-gray-800">
                <span
                  className={`inline-block w-3 h-3 rounded-full mr-[6px] ${colorOptions[currentUser.categoryColors[category.categoryId]] || 'bg-primary'}`}
                />
                {category.name}
              </span>
              <ActionMenu contextId={category.categoryId}>
                {currentUserRole !== 'viewer' && (
                  <EditCategoryDialogue
                    categoryName={category.name}
                    monthlyGoal={category.monthlyGoal}
                    categoryId={category.categoryId}
                    color={null}
                  />
                )}
                {!category.categoryId.includes('other') &&
                  currentUserRole !== 'viewer' && (
                    <DeleteCategoryDialogue categoryId={category.categoryId} />
                  )}
                {category.type === 'savings' ? (
                  <div className="" />
                ) : (
                  <OpenTransactionTableDialogue
                    transactions={category.transactions}
                    eyeSize={18}
                    categoryId={category.categoryId}
                  />
                )}
              </ActionMenu>
            </div>
          </div>
          <div className="flex flex-row gap-1 items-center">
            <Progress
              barHeight={'h-[9px]'}
              rawValueSize={'text-lg'}
              progressPercent={progress}
              rawValue={category.currentNet}
              goal={category.proratedGoal}
              color={
                colorOptions[currentUser.categoryColors[category.categoryId]] ||
                'bg-primary'
              }
            />
          </div>
          <div className="flex flex-row justify-between pt-1 text-gray-500">
            <span>
              {progressPercentage.toFixed(0)}%{' '}
              {category.type === 'savings'
                ? 'saved'
                : category.type === 'spending'
                  ? 'spent'
                  : 'earned'}
            </span>
            <div className="flex flex-row gap-1 items-center">
              <span className="text-gray-500">
                {`
                ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                }).format(category.currentNet)} / 
                ${new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  maximumFractionDigits: 0,
                  minimumFractionDigits: 0,
                }).format(category.proratedGoal)}
              `}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col justify-center p-0 pt-[3px] md:pt-[9px]">
        <div className="flex justify-between w-full">
          <div
            className={`ml-1 mb-1 flex flex-row items-center touch-none select-none ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={() => setIsGrabbing(true)}
            onMouseUp={() => setIsGrabbing(false)}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsGrabbing(true);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setIsGrabbing(false);
            }}
            onTouchMove={(e) => e.stopPropagation()}
            {...listeners}
            {...attributes}
          >
            <Grip size={26} />
          </div>
          {category.subcategories.length > 0 && (
            <CollapsibleTrigger asChild>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                className={`transition-transform duration-200 mr-1 ${
                  areSubcategoriesOpen ? 'rotate-180' : ''
                } hover:bg-inherit`}
              >
                <ChevronDown
                  className={`transition-transform duration-300 rotate-180`}
                  size={22}
                />
              </button>
            </CollapsibleTrigger>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

const SubcategoryCard = forwardRef(
  (
    { subcategory, subcategoryLength, index, category, color, mutedColor },
    ref
  ) => {
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
        className={`shadow-none bg-card-subcategory/60 ${getRoundedStyle()} select-none z-10 ${isGrabbing && 'z-30'} relative border-t border-neutral-300`}
        style={style}
      >
        <CardHeader className="p-0"></CardHeader>
        <CardContent className="pb-6 pt-4">
          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-[5px] ml-[8px] -mb-[7px]">
              <span className="text-md font-bold">{subcategory.name}</span>
              <ActionMenu contextId={subcategory.subcategoryId}>
                <EditSubcategoryDialogue
                  subcategory={subcategory}
                  subcategoryId={subcategory.subcategoryId}
                  categoryId={category.categoryId}
                />
                {!subcategory.subcategoryId.includes('other') && (
                  <DeleteSubcategoryDialogue
                    subcategoryId={subcategory.subcategoryId}
                    categoryId={category.categoryId}
                  />
                )}
                <OpenTransactionTableDialogue
                  transactions={subcategory.transactions}
                  eyeSize={17}
                  categoryId={subcategory.subcategoryId}
                />
              </ActionMenu>
            </div>
            <div className="flex flex-row gap-1 items-center">
              <span className="text-md">$0</span>
              <Progress
                barHeight={'h-[8px]'}
                rawValueSize={'text-md'}
                progressPercent={progress}
                rawValue={subcategory.currentNet}
                goal={subcategory.proratedGoal}
                color={color}
                mutedColor={mutedColor}
              />
              <span className="text-md">{`$${subcategory.proratedGoal}`}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col justify-center p-0">
          <div className="flex flex-row justify-between items-center w-full">
            <div
              className={`flex flex-row touch-none select-none ml-1 mb-1 ${isGrabbing ? 'cursor-grabbing' : 'cursor-grab'}`}
              onMouseDown={() => setIsGrabbing(true)}
              onMouseUp={() => setIsGrabbing(false)}
              onTouchStart={(e) => {
                e.stopPropagation();
                setIsGrabbing(true);
              }}
              onTouchEnd={(e) => {
                e.stopPropagation();
                setIsGrabbing(false);
              }}
              onTouchMove={(e) => e.stopPropagation()}
              {...listeners}
              {...attributes}
            >
              <Grip size={24} />
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  }
);

const CategoryCardCollapsible = ({
  category,
  subcategories,
  color,
  mutedColor,
}) => {
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
      className={`${isGrabbing ? 'z-50' : 'z-40'} select-none relative border border-border rounded-xl`}
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
        color={color}
        mutedColor={mutedColor}
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
                color={color}
                mutedColor={mutedColor}
              />
            </CollapsibleContent>
          ))}
        </SortableContext>
      </DndContext>
    </Collapsible>
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
              'w-[135px] flex items-center text-card-foreground text-md bg-card hover:border-primary hover:text-primary text-gray-800',
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
        <PopoverContent
          className="w-auto p-0 bg-card z-50 text-card-foreground"
          align="start"
        >
          <Calendar
            mode="single"
            selected={startDate}
            defaultMonth={startDate}
            onSelect={(date) => {
              if (date) {
                setStartDate(date.toISOString().split('T')[0]);
              }
            }}
            initialFocus
            className="[&_.rdp-day_focus]:bg-primary [&_.rdp-day_selected]:text-white"
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-[135px] flex items-center text-card-foreground text-md bg-card hover:border-primary hover:text-primary',
              !endDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon />
            {endDate ? format(endDate, 'LLL dd, y') : <span>End Date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-card z-50 text-card-foreground"
          align="start"
        >
          <Calendar
            mode="single"
            selected={endDate}
            defaultMonth={endDate}
            onSelect={(date) => {
              if (date) {
                setEndDate(date.toISOString().split('T')[0]);
              }
            }}
            initialFocus
            className="[&_.rdp-day_focus]:bg-primary [&_.rdp-day_selected]:text-white"
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
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const [currentUserRole, setCurrentUserRole] = useAtom(currentUserRoleAtom);
  const { toast } = useToast();

  // Onboarding modal state (server-driven)
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  useEffect(() => {
    const fetchStatus = async () => {
      const done = await getOnboardingStatus();
      if (!done) setOnboardingOpen(true);
    };
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('mp_existing_user')) {
      localStorage.setItem('mp_existing_user', 'true');
    }
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setCategoriesState(categories);
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
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
      return () => clearTimeout(timer);
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
    <>
      {/* <OnboardingModal
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        type={type}
      /> */}
      <CategoryContext.Provider
        value={{ categoriesState, setCategoriesState, setPreviousState }}
      >
        {isLoading ? (
          <div className="flex flex-col w-full flex-grow gap-4 mt-2 mb-2">
            <div className="flex flex-col justify-center items-center gap-2">
              <div
                className="flex flex-row justify-between gap-4 w-[95%] lg:max-w-[1152.5px]"
                key="create-category-dialogue-skeleton"
              >
                <div className="flex flex-row flex-wrap gap-2 items-center">
                  <Skeleton className="h-9 w-[135px] bg-neutral-300" />
                  <Skeleton className="h-9 w-[135px] bg-neutral-300" />
                </div>
                {(type === 'spending' || type === 'income') && (
                  <Skeleton className="h-9 w-9 bg-neutral-300" />
                )}
              </div>

              {Array.from({ length: type === 'savings' ? 1 : 7 }).map(
                (_, index) => (
                  <div
                    className="flex flex-col w-[95%] lg:max-w-[1152.5px]"
                    key={index}
                  >
                    <Skeleton className="h-[120.73px] w-full rounded-xl bg-neutral-300" />
                  </div>
                )
              )}
            </div>
          </div>
        ) : (
          <CategoryNamesContext.Provider value={categoryNames}>
            <TypeContext.Provider value={type}>
              <div className="flex flex-col w-full h-full gap-4 mb-2 mt-2">
                <div className="flex flex-col justify-center items-center gap-2">
                  <div
                    className="flex flex-row justify-between gap-4 w-[95%] lg:max-w-[1152.5px]"
                    key="create-category-dialogue"
                  >
                    <DatePickers
                      startDate={startDateState}
                      endDate={endDateState}
                    />
                    {(type === 'spending' || type === 'income') &&
                      currentUserRole !== 'viewer' && (
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
                      {categoriesState.map((category, index) => (
                        <div
                          className="flex flex-col w-[95%] lg:max-w-[1152.5px] rounded-xl"
                          key={category.categoryId}
                        >
                          <CategoryCardCollapsible
                            key={category.categoryId}
                            id={category.categoryId}
                            category={category}
                            subcategories={category.subcategories}
                            color={
                              index % 2 === 0 ? 'bg-primary' : 'bg-secondary'
                            }
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
      {/* <Portal>
        <div className="h-screen w-screen flex justify-center items-center z-0 pointer-events-none">
          <div className="lg:max-w-[1152.5px] w-[95%] h-full relative z-0 pointer-events-none">
            <Button
              variant="default"
              size="default"
              className="z-50 text-white hover:bg-primary-dark rounded-full h-8 w-8 text-lg absolute bottom-20 right-0 pointer-events-auto"
              onClick={() => setOnboardingOpen(true)}
            >
              ?
            </Button>
          </div>
        </div>
      </Portal> */}
    </>
  );
}
