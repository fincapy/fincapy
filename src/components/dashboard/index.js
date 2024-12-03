'use client';

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
import { useState } from 'react';
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
      <DialogContent className="sm:max-w-11/12">
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
      <DialogContent className="sm:max-w-11/12">
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
                <Input placeholder="Subcategory Name" {...field} />
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
      <DialogContent className="sm:max-w-11/12">
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

const OpenTransactionTableDialogue = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <VisuallyHidden>
            <DialogTitle>Transactions</DialogTitle>
            <DialogDescription>
              A list of transactions associated with this category
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>
        <TransactionTable />
      </DialogContent>
    </Dialog>
  );
};

const CategoryCard = ({
  spendingCategory,
  areSubcategoriesOpen,
  subcategoryLength,
}) => {
  const [isStickyTop, setIsStickyTop] = useState(false);
  const [isPushedBottom, setIsPushedBottom] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const topSentinel = document.createElement('div');
    const bottomSentinel = document.createElement('div');
    topSentinel.className = 'absolute top-0 w-full h-1';
    bottomSentinel.className = 'absolute bottom-0 w-full h-1';

    // Add sentinels to the container
    const container = cardRef.current?.parentElement;
    container.style.position = 'relative';
    container.appendChild(topSentinel);
    container.appendChild(bottomSentinel);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === topSentinel) {
            console.log('top');
            // Check if the top sentinel is out of view (stuck at the top)
            setIsStickyTop(!entry.isIntersecting);
          } else if (entry.target === bottomSentinel) {
            console.log('bottom');
            // Check if the bottom sentinel is in view (pushed to the bottom)
            setIsPushedBottom(entry.isIntersecting);
          }
        });
      },
      { root: null, threshold: 0.1 } // Adjust threshold as needed
    );

    observer.observe(topSentinel);
    observer.observe(bottomSentinel);

    return () => {
      observer.disconnect();
      container.removeChild(topSentinel);
      container.removeChild(bottomSentinel);
    };
  }, []);

  const getRoundedStyle = () => {
    if (
      !areSubcategoriesOpen ||
      subcategoryLength === 0 ||
      subcategoryLength === null
    ) {
      return 'rounded-xl';
    }

    if (isStickyTop && !isPushedBottom) {
      return 'rounded-b-none rounded-t-xl';
    } else if (!isStickyTop && isPushedBottom) {
      return 'rounded-b-none rounded-t-xl';
    } else {
      return '';
    }
  };

  return (
    <Card
      ref={cardRef}
      className={`z-10 shadow-none sticky top-12 ${getRoundedStyle()}`}
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
                <OpenTransactionTableDialogue />
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

const SubcategoryCard = ({ areSubcategoriesOpen, spendingSubcategory }) => {
  return (
    <Card
      className={`shadow-none bg-card-subcategory ${areSubcategoriesOpen ? 'rounded-none rounded-b-xl' : ''}`}
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
};

const CategoryCardCollapsible = ({
  spendingCategory,
  spendingSubcategories,
}) => {
  const [areSubcategoriesOpen, setAreSubcategoriesOpen] = useState(false);

  return (
    <Collapsible
      open={areSubcategoriesOpen}
      onOpenChange={setAreSubcategoriesOpen}
    >
      <CategoryCard
        spendingCategory={spendingCategory}
        areSubcategoriesOpen={areSubcategoriesOpen}
        subcategoryLength={spendingSubcategories.length}
      />
      {spendingSubcategories.map((subcategory) => (
        <CollapsibleContent key={subcategory.spendingSubcategoryId}>
          <SubcategoryCard
            spendingSubcategory={subcategory}
            areSubcategoriesOpen={areSubcategoriesOpen}
          />
        </CollapsibleContent>
      ))}
    </Collapsible>
  );
};

export default function Dashboard({ spendingCategories }) {
  return (
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
  );
}
