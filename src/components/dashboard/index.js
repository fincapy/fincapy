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
import { ChevronDown, Eye, Trash2 } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { PlusIcon } from 'lucide-react';
import { DataTableDemo } from '@/components/category-table';
import { ProgressCategory } from '@/components/ui/progress-category';
import { ProgressSubcategory } from '@/components/ui/progress-subcategory';
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
import { createSpendingCategory } from './serverActions';
import { v4 as uuidv4 } from 'uuid';
import { useRef, useEffect } from 'react';

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
    console.log('submit');
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

const CategoryCard = ({ spendingCategory, areSubcategoriesOpen }) => {
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
    if (!areSubcategoriesOpen) {
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
                <Button variant="ghost" size="icon">
                  <Pencil />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 />
                </Button>
                <Button variant="ghost" size="icon">
                  <Eye />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              style={{ marginRight: '-23px', marginTop: '-47px' }}
            >
              <PlusIcon />
            </Button>
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
          <div className="flex flex-row justify-between items-center -mb-3">
            <span>{spendingSubcategory.name}</span>
            <Button variant="ghost" size="icon">
              <Pencil />
            </Button>
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
      />
      {spendingSubcategories.map((subcategory) => (
        <CollapsibleContent key={subcategory.spendingSubcategoryId}>
          <SubcategoryCardCollapsible
            spendingSubcategory={subcategory}
            areSubcategoriesOpen={areSubcategoriesOpen}
          />
        </CollapsibleContent>
      ))}
    </Collapsible>
  );
};

const SubcategoryCardCollapsible = ({
  areSubcategoriesOpen,
  spendingSubcategory,
}) => {
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);

  return (
    <Collapsible open={isDataTableOpen} onOpenChange={setIsDataTableOpen}>
      <SubcategoryCard
        spendingSubcategory={spendingSubcategory}
        areSubcategoriesOpen={areSubcategoriesOpen}
      />
      <CollapsibleContent>
        <DataTableDemo />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function Dashboard({ spendingCategories }) {
  return (
    <div className="flex flex-col w-full flex-grow gap-4 mt-4">
      <div className="flex flex-col justify-center items-center gap-4 mb-8">
        <div className="flex flex-row justify-end items-end gap-4 w-11/12 lg:w-3/4">
          <CreateCategoryDialogue />
        </div>
        {spendingCategories.map((spendingCategory, index) => (
          <div className="flex flex-col w-11/12 lg:w-3/4 shadow-lg rounded-xl">
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
