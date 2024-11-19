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
import { ChevronDown, Plus } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { ChevronUp } from 'lucide-react';
import { DataTableDemo } from '@/components/category-table';
import { ProgressCategory } from '@/components/ui/progress-category';
import { ProgressSubcategory } from '@/components/ui/progress-subcategory';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

const CategoryCard = ({ areSubcategoriesOpen }) => {
  return (
    <Card
      className={`shadow-none ${areSubcategoriesOpen ? 'rounded-none rounded-t-xl' : ''}`}
    >
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row justify-between items-center -mb-3">
            <span>Fixed Costs</span>
            <Button variant="ghost" size="icon">
              <Pencil />
            </Button>
          </div>
        </CardTitle>
        <CardDescription className="w-1/2">
          All the expenses you can expect in a month
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row gap-2 items-center">
          <span className="font-sans">$0</span>
          <ProgressCategory value={50} />
          <span className="font-sans">$100000</span>
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

const SubcategoryCard = ({ areSubcategoriesOpen }) => {
  return (
    <Card
      className={`shadow-none ${areSubcategoriesOpen ? 'rounded-none rounded-b-xl' : ''}`}
    >
      <CardHeader className={'p-0 ml-6 mr-6 mt-4 mb-4'}>
        <CardTitle>
          <div className="flex flex-row justify-between items-center -mb-3">
            <span>Rent</span>
            <Button variant="ghost" size="icon">
              <Pencil />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 mr-6 ml-6">
        <div className="flex flex-row gap-2 items-center">
          <span className="font-sans">$0</span>
          <ProgressSubcategory value={50} />
          <span className="font-sans">$1000</span>
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

const CategoryCardCollapsible = () => {
  const [areSubcategoriesOpen, setAreSubcategoriesOpen] = useState(false);

  return (
    <Collapsible
      open={areSubcategoriesOpen}
      onOpenChange={setAreSubcategoriesOpen}
    >
      <CategoryCard areSubcategoriesOpen={areSubcategoriesOpen} />
      <CollapsibleContent>
        <SubcategoryCardCollapsible
          areSubcategoriesOpen={areSubcategoriesOpen}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

const SubcategoryCardCollapsible = ({ areSubcategoriesOpen }) => {
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);

  return (
    <Collapsible open={isDataTableOpen} onOpenChange={setIsDataTableOpen}>
      <SubcategoryCard areSubcategoriesOpen={areSubcategoriesOpen} />
      <CollapsibleContent>
        <DataTableDemo />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default function Dashboard() {
  return (
    <div className="flex flex-col w-full flex-grow gap-4 mt-4">
      <div className="flex flex-col justify-center items-center">
        <div className="flex flex-col w-11/12 lg:w-3/4 shadow-lg rounded-xl">
          <CategoryCardCollapsible />
        </div>
      </div>
    </div>
  );
}
