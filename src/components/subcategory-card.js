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
import { ProgressSubcategory } from './ui/progress-subcategory';

const SubcategoryCard = () => (
  <Card className="shadow-none bg-slate-100">
    <CardHeader className="p-0 ml-6 mr-6 mt-4 mb-4">
      <CardTitle>
        <div className="flex flex-row justify-between items-center -mb-3">
          <span>Rent</span>
          <Button className="bg-slate-600 hover:bg-slate-800" size="icon">
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
        <Button variant="ghost" size="icon" className="hover:bg-inherit">
          <ChevronUp />
        </Button>
      </div>
    </CardFooter>
  </Card>
);

export default SubcategoryCard;
