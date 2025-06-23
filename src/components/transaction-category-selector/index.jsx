'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAtom } from 'jotai';
import { planAtom } from '../state/atoms';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FormControl } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';

const TransactionCategorySelector = ({ field, type }) => {
  const [plan] = useAtom(planAtom);
  const [open, setOpen] = useState(false);

  const categories = useMemo(() => {
    if (!plan) return [];

    let allCategories = [];

    // Determine which category type to filter by.
    let categoryTypeFilter = type;
    if (type === 'refund') {
      categoryTypeFilter = 'spending';
    } else if (type === 'transfer' || type === 'credit_card_payment') {
      categoryTypeFilter = null; // No filtering, show all
    }

    plan.categories.forEach((category) => {
      // If a filter is set, and it doesn't match, skip this category.
      if (categoryTypeFilter && category.type !== categoryTypeFilter) {
        return;
      }

      // Prefix is only added when no transaction type is selected yet.
      const prefix = !type
        ? `${category.type.charAt(0).toUpperCase() + category.type.slice(1)}: `
        : '';

      if (category.name === 'Other') {
        const generalSub = category.subcategories.find(
          (sub) => sub.isImmutable
        );
        if (generalSub) {
          allCategories.push({
            label: `${prefix}${category.name}`,
            value: generalSub.subcategoryId,
          });
        }
      } else {
        category.subcategories.forEach((subcategory) => {
          allCategories.push({
            label: `${prefix}${category.name} - ${subcategory.name}`,
            value: subcategory.subcategoryId,
          });
        });
      }
    });

    // For these types, allow the user to not select a category.
    if (type === 'transfer' || type === 'credit_card_payment' || !type) {
      allCategories.unshift({ label: 'None', value: '' });
    }

    allCategories.sort((a, b) => {
      if (a.value === '') return -1; // 'None' always at the top.
      if (b.value === '') return 1;
      return a.label.localeCompare(b.label);
    });

    return allCategories;
  }, [plan, type]);

  useEffect(() => {
    const selectedCategoryExists = categories.some(
      (c) => c.value === field.value
    );
    // If the currently selected category is not in the new filtered list, clear it.
    // Check for undefined to handle initial state correctly.
    if (field.value !== undefined && !selectedCategoryExists) {
      field.onChange(undefined);
    }
  }, [categories, field]);

  const selectedCategoryLabel = categories.find(
    (c) => c.value === field.value
  )?.label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedCategoryLabel || 'Select a category...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0 bg-card">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandEmpty>No category found.</CommandEmpty>
          <ScrollArea className="h-48">
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.value}
                  value={category.label}
                  onSelect={() => {
                    field.onChange(category.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      field.value === category.value
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {category.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default TransactionCategorySelector;
