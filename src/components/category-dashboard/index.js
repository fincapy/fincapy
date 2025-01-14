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
import { ChevronDown, Eye, Pen, Trash2 } from 'lucide-react';
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
import { PlanContext } from '../dashboard-layout/planContext';
import {
  StartDateContext,
  EndDateContext,
} from '../dashboard-layout/datesContext';
import { useMemo } from 'react';

const createCategoryFormSchema = z.object({
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }),
  monthlyGoal: z.string().regex(/^[\d$,]+$/, {
    message: 'Enter a number between 0 and 1000000000',
  }),
});

const CreateCategoryForm = () => {
  const { categoriesState, setCategoriesState, setPreviousState } =
    useContext(CategoryContext);
  const type = useContext(TypeContext);
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlyGoal: null,
    },
  });

  async function onSubmit(values) {
    const monthlyGoal = parseInt(
      values.monthlyGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;
    const categoryId = uuidv4();

    createCategoryState({
      name,
      categoryId,
      monthlyGoal,
      categoriesState,
      setCategoriesState,
      setPreviousState,
      type,
    });
    await createCategory({
      name,
      categoryId,
      monthlyGoal,
      planId: 'initial',
      type,
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
  const onClick = async () => {
    await deleteCategory({ categoryId, planId: 'initial' });
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
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: categoryName,
      monthlyGoal: monthlyGoal.toString(),
    },
  });

  async function onSubmit(values) {
    const monthlyGoal = parseInt(
      values.monthlyGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;

    await updateCategory({
      name,
      categoryId,
      monthlyGoal,
      planId: 'initial',
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

  async function onSubmit(values) {
    const monthlyGoal = parseInt(
      values.monthlyGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;
    const subcategoryId = uuidv4();

    await createSubcategory({
      name,
      monthlyGoal,
      categoryId,
      subcategoryId,
      planId: 'initial',
      type,
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
            marginRight: '-23px',
            marginTop: '-47px',
          }}
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

const EditSubcategoryForm = ({ subcategoryId }) => {
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

  async function onSubmit(values) {
    const monthlyGoal = parseInt(
      values.monthlyGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;

    await updateSubcategory({
      name,
      monthlyGoal,
      subcategoryId,
      planId: 'initial',
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

const EditSubcategoryDialogue = ({ subcategoryId }) => {
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
          <EditSubcategoryForm subcategoryId={subcategoryId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeleteSubcategoryDialogue = ({
  subcategoriesState,
  subcategoryId,
  setSubcategoriesState,
  setPreviousState,
  setAreSubcategoriesOpen,
}) => {
  const onClick = async () => {
    console.log('here?');
    deleteSubcategoryState({
      subcategoriesState,
      setSubcategoriesState,
      setPreviousState,
      subcategoryId,
      setAreSubcategoriesOpen,
    });
    await deleteSubcategory({ subcategoryId, planId: 'initial' });
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
      className={`z-10 shadow-none sticky -top-1 ${getRoundedStyle()}`}
    >
      <CardHeader>
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
                <OpenTransactionTableDialogue
                  transactions={category.transactions}
                  categoryId={category.categoryId}
                />
              </div>
            </div>
            <CreateSubcategoryDialogue
              categoryId={category.categoryId}
              setDropdownIsOpen={setAreSubcategoriesOpen}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-2 items-center">
          <span>$0</span>
          <ProgressCategory value={progress} />
          <span>{`$${category.proratedGoal}`}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col justify-center p-0">
        <div className="flex flex-row-reverse w-full">
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
  (
    {
      subcategoriesState,
      subcategory,
      subcategoryLength,
      index,
      setSubcategoriesState,
      setPreviousState,
      setAreSubcategoriesOpen,
    },
    ref
  ) => {
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
        className={`shadow-none bg-card-subcategory ${getRoundedStyle()} cursor-move`}
        style={style}
        {...attributes}
        {...listeners}
      >
        <CardHeader className={'p-0 ml-6 mr-6 mt-4 mb-4'}>
          <CardTitle>
            <div className="flex flex-row items-center gap-2">
              <span>{subcategory.name}</span>
              <div className="flex flex-row gap-0 items-center">
                <EditSubcategoryDialogue
                  subcategoryId={subcategory.subcategoryId}
                />
                <DeleteSubcategoryDialogue
                  subcategoriesState={subcategoriesState}
                  subcategoryId={subcategory.subcategoryId}
                  setSubcategoriesState={setSubcategoriesState}
                  setPreviousState={setPreviousState}
                  setAreSubcategoriesOpen={setAreSubcategoriesOpen}
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
        <CardContent className="p-0 mr-6 ml-6 mb-6">
          <div className="flex flex-row gap-2 items-center">
            <span>$0</span>
            <ProgressCategory value={progress} />
            <span>{`$${subcategory.proratedGoal}`}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
);

const CategoryCardCollapsible = ({ category, subcategories }) => {
  const [areSubcategoriesOpen, setAreSubcategoriesOpen] = useState(false);
  const [isOverlapping, setIsOverlapping] = useState(false);

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
      {...attributes}
      {...listeners}
      className="cursor-move"
    >
      <CategoryCard
        category={category}
        areSubcategoriesOpen={areSubcategoriesOpen}
        subcategoryLength={subcategoriesState.length}
        categoryCardRef={categoryCardRef}
        isOverlapping={isOverlapping}
        setAreSubcategoriesOpen={setAreSubcategoriesOpen}
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
    if (date <= endDate) {
      setStartDateState(date);
    } else {
      alert('Start date cannot be after the end date.');
    }
  };

  const setEndDate = (date) => {
    if (date >= startDate) {
      setEndDateState(date);
    } else {
      alert('End date cannot be before the start date.');
    }
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 items-center">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'min-w-28 justify-start text-left font-normal',
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
            onSelect={(date) =>
              setStartDateState(date.toISOString().split('T')[0])
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'min-w-28 justify-start text-left font-normal',
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
            onSelect={(date) =>
              setEndDateState(date.toISOString().split('T')[0])
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default function CategoryDashboard({ type }) {
  const { planState, setPlanState } = useContext(PlanContext);
  const { startDateState, setStartDateState } = useContext(StartDateContext);
  const { endDateState, setEndDateState } = useContext(EndDateContext);
  let categories = [];

  categories = useMemo(() => {
    if (type === 'spending') {
      return planState.toSpendingView();
    } else if (type === 'income') {
      return planState.toIncomeView();
    } else if (type === 'savings') {
      return planState.toSavingsView();
    }
    return [];
  }, [type, planState]);

  let categoryNames = Object.values(categories)
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

  Object.values(categories).forEach((category) => {
    categoryNames.push({
      name: category.name,
      id: category.categoryId,
      transactions: category.transactions,
    });
  });

  // sort the category names alphabetically starting with a
  categoryNames.sort((a, b) => {
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const [previousState, setPreviousState] = useState(categories);
  const [categoriesState, setCategoriesState] = useState(categories);

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
      <CategoryNamesContext.Provider value={categoryNames}>
        <TypeContext.Provider value={type}>
          <div className="flex flex-col w-full flex-grow gap-4 mt-4 mb-16">
            <div className="flex flex-col justify-center items-center gap-4 mb-8">
              <div
                className="flex flex-row justify-between gap-4 w-11/12 lg:w-3/4"
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
                  items={categoriesState.map((category) => category.categoryId)}
                  strategy={verticalListSortingStrategy}
                >
                  {categoriesState.map((category) => (
                    <div
                      className="flex flex-col w-11/12 lg:w-3/4 shadow-lg rounded-xl"
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
    </CategoryContext.Provider>
  );
}
