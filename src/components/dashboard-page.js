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

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col w-full flex-grow gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-row justify-center">
          <div className="flex flex-row w-11/12 lg:w-3/4 justify-between">
            <h1 className="scroll-m-20 text-2xl font-semibold tracking-tight">
              Spending
            </h1>
            <Button variant="outline" size="icon">
              <Plus />
            </Button>
          </div>
        </div>
        <div className="flex flex-row justify-center">
          <Separator className="w-11/12 lg:w-3/4" />
        </div>
      </div>
      <div className="flex flex-col justify-center items-center">
        <div className="flex flex-col w-10/12 lg:w-2/3 shadow-md">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>
                  <div className="flex flex-row justify-between items-center -mb-3">
                    <span>Fixed Costs</span>
                    <Button
                      className="bg-lime-600 hover:bg-lime-800"
                      size="icon"
                    >
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
                        isOpen ? 'rotate-180' : ''
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
            <CollapsibleContent className="transition-all duration-300 ease-in">
              <Card className="shadow-none bg-slate-100">
                <CardHeader className="p-0 ml-6 mr-6 mt-4 mb-4">
                  <CardTitle>
                    <div className="flex flex-row justify-between items-center -mb-3">
                      <span>Rent</span>
                      <Button
                        className="bg-slate-600 hover:bg-slate-800"
                        size="icon"
                      >
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-inherit"
                    >
                      <ChevronUp />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
