'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef(
  ({ className, progressPercent, rawValue, ...props }, ref) => {
    let percentage = Math.min(Math.max(progressPercent, 0), 100);
    if (rawValue === 0 && !progressPercent) {
      percentage = 100;
    }

    return (
      <div className="relative w-full">
        <ProgressPrimitive.Root
          ref={ref}
          className={cn(
            'relative h-2 w-full overflow-hidden rounded-full bg-primary/20',
            className
          )}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className="h-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </ProgressPrimitive.Root>
        <div
          className="absolute top-[-23px] text-sm font-bold text-foreground"
          style={{ left: `calc(${percentage}% - 15px)` }} // Adjust positioning
        >
          ${rawValue}
        </div>
      </div>
    );
  }
);

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
