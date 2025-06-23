'use client';

import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { format, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';

const DatePickerFormField = ({ form, name }) => {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full pl-3 text-left font-normal text-sm',
                    !field.value && 'text-muted-foreground'
                  )}
                >
                  {field.value ? (
                    format(parse(field.value, 'yyyy-MM-dd', new Date()), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-card z-[9999]"
              align="start"
            >
              <Calendar
                mode="single"
                selected={
                  field.value
                    ? parse(field.value, 'yyyy-MM-dd', new Date())
                    : undefined
                }
                onSelect={(date) => {
                  field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                }}
                disabled={false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default DatePickerFormField;
