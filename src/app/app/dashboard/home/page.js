import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TypographyH1 } from '@/components/typography-h1';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { ChevronUp } from 'lucide-react';
import { DataTableDemo } from '@/components/category-table';
import CategoryCard from '@/components/category-card';
import SubcategoryCard from '@/components/subcategory-card';

export default async function Dashboard() {
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
          <CategoryCard />
          <SubcategoryCard />
        </div>
      </div>
    </div>
  );
}
