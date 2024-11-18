'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Button } from './ui/button';
import { ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { ProgressCategory } from './ui/progress-category';

const CategoryCard = () => (
  <Card className="shadow-none">
    <CardHeader>
      <CardTitle>
        <div className="flex flex-row justify-between items-center -mb-3">
          <span>Fixed Costs</span>
          <Button className="bg-lime-600 hover:bg-lime-800" size="icon">
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
        <Button variant="ghost" size="icon" className="hover:bg-inherit">
          <ChevronUp />
        </Button>
      </div>
    </CardFooter>
  </Card>
);

export default CategoryCard;
