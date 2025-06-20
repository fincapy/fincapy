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
import { ChevronDown, Eye, Grip, Pen, Trash2 } from 'lucide-react';
import { Pencil } from 'lucide-react';
import { PlusIcon } from 'lucide-react';
import { Progress } from '../ui/progress';
import TransactionList from '../transaction-list';
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
import { createTransaction } from './serverActions';
import { v4 as uuidv4 } from 'uuid';
import { useRef, useEffect, useMemo } from 'react';
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
import { useAtom, useAtomValue } from 'jotai';
import {
  planAtom,
  isLoadingAtom,
  currentUserAtom,
  transactionsViewAtom,
  currentUserRoleAtom,
  transactionSearchQueryAtom,
} from '../state/atoms';
import { Skeleton } from '@/components/ui/skeleton';
import { ToastAction } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { transactionTypes } from '@/backend/domain/transaction';
import SubmitButton from '@/components/SubmitButton';
import { colorOptions } from '../category-dashboard/ColorSelector';

const TransactionsDashboard = () => {
  const [rawTransactions, setTransactions] = useAtom(transactionsViewAtom);
  const [currentUserRole, setCurrentUserRole] = useAtom(currentUserRoleAtom);
  const [plan] = useAtom(planAtom);
  const [currentUser] = useAtom(currentUserAtom);
  const searchQuery = useAtom(transactionSearchQueryAtom);

  const transactions = useMemo(() => {
    if (!rawTransactions || !plan || !currentUser?.categoryColors) {
      return (
        rawTransactions
          ?.map((tx) => ({
            ...tx,
            icon: 'badgeHelp',
            color: 'amber',
          }))
          .filter(
            (tx) =>
              tx.description
                .toLowerCase()
                .includes(searchQuery[0].toLowerCase()) ||
              tx.amount
                .toString()
                .toLowerCase()
                .includes(searchQuery[0].toLowerCase())
          ) || []
      );
    }

    const categoryMap = new Map();
    plan.categories.forEach((cat) => {
      categoryMap.set(cat.categoryId, cat);
      cat.subcategories.forEach((sub) => {
        categoryMap.set(sub.subcategoryId, { ...sub, parentCategory: cat });
      });
    });

    return rawTransactions.map((tx) => {
      const id = tx.subcategoryId || tx.categoryId;
      const categoryOrSubcategory = categoryMap.get(id);

      if (categoryOrSubcategory) {
        const parentCategory =
          categoryOrSubcategory.parentCategory || categoryOrSubcategory;
        const icon =
          categoryOrSubcategory.icon || parentCategory.icon || 'badgeHelp';
        const colorName =
          currentUser.categoryColors[parentCategory.categoryId] || 'amber';

        return {
          ...tx,
          icon: icon,
          color: colorName,
        };
      }

      return {
        ...tx,
        icon: 'badgeHelp',
        color: 'amber',
      };
    });
  }, [rawTransactions, plan, currentUser, searchQuery]);

  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  useEffect(() => {
    if (transactions) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [transactions, setIsLoading]);

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col w-full flex-grow gap-4 mb-2">
          <div className="flex flex-col justify-center items-center gap-2">
            <Skeleton className="h-[70vh] w-[95%] lg:max-w-[1152.5px] bg-card" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full h-full gap-4">
          <div className="flex flex-col justify-center items-center gap-2 flex-shrink">
            <div className="grid w-[95%] lg:max-w-[1152.5px] h-full bg-card rounded-xl">
              <TransactionList transactions={transactions} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export { TransactionsDashboard };
