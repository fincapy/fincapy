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
  createSpendingCategory,
  updateSpendingCategory,
  deleteSpendingCategory,
  createSpendingSubcategory,
  updateSpendingSubcategory,
  deleteSpendingSubcategory,
} from './serverActions';
import { v4 as uuidv4 } from 'uuid';
import { useRef, useEffect } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CategoryContext } from './categoryContext';

const createCategoryFormSchema = z.object({
  name: z.string().min(1, {
    message: 'Name must be at least 1 character.',
  }),
  monthlySpendingGoal: z.string().regex(/^[\d$,]+$/, {
    message: 'Enter a number between 0 and 1000000000',
  }),
});

const CreateCategoryForm = () => {
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlySpendingGoal: null,
    },
  });

  async function onSubmit(values) {
    const monthlySpendingGoal = parseInt(
      values.monthlySpendingGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;
    const spendingCategoryId = uuidv4();

    await createSpendingCategory({
      name,
      spendingCategoryId,
      monthlySpendingGoal,
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
          name="monthlySpendingGoal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Spending Goal</FormLabel>
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
          <Button type="submit">Create</Button>
        </DialogClose>
      </form>
    </Form>
  );
};

const CreateCategoryDialogue = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-11/12">
        <DialogHeader>
          <DialogTitle>Create Spending Category</DialogTitle>
          <DialogDescription>
            Add a new custom spending category
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CreateCategoryForm />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeleteCategoryDialogue = ({ spendingCategoryId }) => {
  const onClick = async () => {
    await deleteSpendingCategory({ spendingCategoryId });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-11/12">
        <DialogHeader>
          <DialogTitle>Delete Spending Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this category? All transactions
            associated with this category will be moved to uncategorized.
          </DialogDescription>
        </DialogHeader>
        <Button variant="destructive" onClick={onClick}>
          Delete
        </Button>
      </DialogContent>
    </Dialog>
  );
};

const EditCategoryForm = ({
  spendingCategoryName,
  monthlySpendingGoal,
  spendingCategoryId,
}) => {
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: spendingCategoryName,
      monthlySpendingGoal: monthlySpendingGoal.toString(),
    },
  });

  async function onSubmit(values) {
    const monthlySpendingGoal = parseInt(
      values.monthlySpendingGoal.replace(',', '').replace('$', ''),
      10
    );
    const name = values.name;

    await updateSpendingCategory({
      name,
      spendingCategoryId,
      monthlySpendingGoal,
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
          name="monthlySpendingGoal"
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

const EditCategoryDialogue = ({
  spendingCategoryName,
  monthlySpendingGoal,
  spendingCategoryId,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-11/12"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Spending Category</DialogTitle>
          <DialogDescription>
            Edit your existing spending category
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <EditCategoryForm
            spendingCategoryName={spendingCategoryName}
            monthlySpendingGoal={monthlySpendingGoal}
            spendingCategoryId={spendingCategoryId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CreateSubcategoryForm = ({ spendingCategoryId }) => {
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlySpendingGoal: '',
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
    const monthlySpendGoal = parseInt(
      values.monthlySpendingGoal.replace(',', '').replace('$', ''),
      10
    );
    const yearlySpendGoal = monthlySpendGoal * 12;
    const name = values.name;
    const spendingSubcategoryId = uuidv4();

    await createSpendingSubcategory({
      name,
      monthlySpendGoal,
      yearlySpendGoal,
      spendingCategoryId,
      spendingSubcategoryId,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
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
          name="monthlySpendingGoal"
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

const CreateSubcategoryDialogue = ({ spendingCategoryId }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          style={{ marginRight: '-23px', marginTop: '-47px' }}
        >
          <PlusIcon />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-11/12"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Subcategory</DialogTitle>
          <DialogDescription>
            Create a new subcategory for your spending category
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <CreateSubcategoryForm spendingCategoryId={spendingCategoryId} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditSpendingSubcategoryForm = ({ spendingSubcategoryId }) => {
  const form = useForm({
    resolver: zodResolver(createCategoryFormSchema),
    defaultValues: {
      name: '',
      monthlySpendingGoal: '',
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
    const monthlySpendGoal = parseInt(
      values.monthlySpendingGoal.replace(',', '').replace('$', ''),
      10
    );
    const yearlySpendGoal = monthlySpendGoal * 12;
    const name = values.name;

    await updateSpendingSubcategory({
      name,
      monthlySpendGoal,
      yearlySpendGoal,
      spendingSubcategoryId,
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-3"
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
          name="monthlySpendingGoal"
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

const EditSubcategoryDialogue = ({ spendingSubcategoryId }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-11/12"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Subcategory</DialogTitle>
          <DialogDescription>Edit your existing subcategory</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <EditSpendingSubcategoryForm
            spendingSubcategoryId={spendingSubcategoryId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DeleteSubcategoryDialogue = ({ spendingSubcategoryId }) => {
  const onClick = async () => {
    await deleteSpendingSubcategory({ spendingSubcategoryId });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-11/12">
        <DialogHeader>
          <DialogTitle>Delete Subcategory</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this subcategory?
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="destructive" onClick={onClick}>
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
        <Button variant="ghost" size="icon">
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
  spendingCategory,
  areSubcategoriesOpen,
  subcategoryLength,
  categoryCardRef,
  isOverlapping,
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

  return (
    <Card
      ref={categoryCardRef}
      className={`z-10 shadow-none sticky top-[51px] ${getRoundedStyle()}`}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row justify-between items-center -mb-3">
            <div className="flex flex-row items-center gap-2">
              <span>{spendingCategory.name}</span>
              <div className="flex flex-row gap-0 items-center">
                <EditCategoryDialogue
                  spendingCategoryName={spendingCategory.name}
                  monthlySpendingGoal={spendingCategory.monthlySpendGoal}
                  spendingCategoryId={spendingCategory.spendingCategoryId}
                />
                <DeleteCategoryDialogue
                  spendingCategoryId={spendingCategory.spendingCategoryId}
                />
                <OpenTransactionTableDialogue
                  transactions={spendingCategory.transactions}
                  categoryId={spendingCategory.spendingCategoryId}
                />
              </div>
            </div>
            <CreateSubcategoryDialogue
              spendingCategoryId={spendingCategory.spendingCategoryId}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-2 items-center">
          <span className="font-sans">$0</span>
          <ProgressCategory value={50} />
          <span className="font-sans">{`$${spendingCategory.monthlySpendGoal}`}</span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col justify-center p-0">
        <div className="flex flex-row-reverse w-full">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
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
    { areSubcategoriesOpen, spendingSubcategory, subcategoryLength, index },
    ref
  ) => {
    const getRoundedStyle = () => {
      if (index === subcategoryLength - 1) {
        return 'rounded-none rounded-b-xl';
      }

      return 'rounded-none';
    };

    return (
      <Card
        ref={ref}
        className={`shadow-none bg-card-subcategory ${getRoundedStyle()}`}
      >
        <CardHeader className={'p-0 ml-6 mr-6 mt-4 mb-4'}>
          <CardTitle>
            <div className="flex flex-row items-center gap-2">
              <span>{spendingSubcategory.name}</span>
              <div className="flex flex-row gap-0 items-center">
                <EditSubcategoryDialogue
                  spendingSubcategoryId={
                    spendingSubcategory.spendingSubcategoryId
                  }
                />
                <DeleteSubcategoryDialogue
                  spendingSubcategoryId={
                    spendingSubcategory.spendingSubcategoryId
                  }
                />
                <Button variant="ghost" size="icon">
                  <Eye />
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 mr-6 ml-6 mb-6">
          <div className="flex flex-row gap-2 items-center">
            <span className="font-sans">$0</span>
            <ProgressSubcategory value={50} />
            <span className="font-sans">{`$${spendingSubcategory.monthlySpendGoal}`}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
);

const CategoryCardCollapsible = ({
  spendingCategory,
  spendingSubcategories,
}) => {
  const [areSubcategoriesOpen, setAreSubcategoriesOpen] = useState(false);
  const [isOverlapping, setIsOverlapping] = useState(false);

  const categoryCardRef = useRef(null);
  const subcategoryRefs = useRef([
    ...spendingSubcategories.map(() => React.createRef()),
  ]);

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

        // Check if the two rectangles overlap
        const isOverlapping = categoryRect.bottom - 20 > subcategoryRect.top;

        setIsOverlapping(isOverlapping);
      }
    };

    // Attach scroll and resize event listeners
    window.addEventListener('scroll', checkOverlap);
    window.addEventListener('resize', checkOverlap);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('scroll', checkOverlap);
      window.removeEventListener('resize', checkOverlap);
    };
  }, [categoryCardRef, subcategoryRefs, areSubcategoriesOpen]);

  return (
    <Collapsible
      open={areSubcategoriesOpen}
      onOpenChange={setAreSubcategoriesOpen}
    >
      <CategoryCard
        spendingCategory={spendingCategory}
        areSubcategoriesOpen={areSubcategoriesOpen}
        subcategoryLength={spendingSubcategories.length}
        categoryCardRef={categoryCardRef}
        isOverlapping={isOverlapping}
      />
      {spendingSubcategories.map((subcategory, index) => (
        <CollapsibleContent
          key={subcategory.spendingSubcategoryId}
          ref={subcategoryRefs.current[index]}
        >
          <SubcategoryCard
            spendingSubcategory={subcategory}
            areSubcategoriesOpen={areSubcategoriesOpen}
            subcategoryLength={spendingSubcategories.length}
            index={index}
          />
        </CollapsibleContent>
      ))}
    </Collapsible>
  );
};

export default function Dashboard({ spendingCategories }) {
  let categoryNames = Object.values(spendingCategories)
    .map((spendingCategory) =>
      spendingCategory.spendingSubcategories.map((spendingSubcategory) => {
        return {
          name: `${spendingCategory.name} - ${spendingSubcategory.name}`,
          id: spendingSubcategory.spendingSubcategoryId,
          transactions: spendingSubcategory.transactions,
        };
      })
    )
    .flat();

  Object.values(spendingCategories).forEach((spendingCategory) => {
    categoryNames.push({
      name: spendingCategory.name,
      id: spendingCategory.spendingCategoryId,
      transactions: spendingCategory.transactions,
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

  return (
    <CategoryContext.Provider value={categoryNames}>
      <div className="flex flex-col w-full flex-grow gap-4 mt-4">
        <div className="flex flex-col justify-center items-center gap-4 mb-8">
          <div
            className="flex flex-row justify-end items-end gap-4 w-11/12 lg:w-3/4"
            key="create-category-dialogue"
          >
            <CreateCategoryDialogue />
          </div>
          {spendingCategories.map((spendingCategory, index) => (
            <div
              className="flex flex-col w-11/12 lg:w-3/4 shadow-lg rounded-xl"
              key={spendingCategory.spendingCategoryId}
            >
              <CategoryCardCollapsible
                key={spendingCategory.spendingCategoryId}
                spendingCategory={spendingCategory}
                spendingSubcategories={spendingCategory.spendingSubcategories}
              />
            </div>
          ))}
        </div>
      </div>
    </CategoryContext.Provider>
  );
}
