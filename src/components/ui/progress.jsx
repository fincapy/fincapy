'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef(
  (
    { className, progressPercent, rawValue, goal, color, mutedColor, ...props },
    ref
  ) => {
    let percentage = Math.min(Math.max(progressPercent, 0), 100);
    if (rawValue === 0 && goal === 0) {
      percentage = 100;
    }

    return (
      <div className="relative w-full">
        <ProgressPrimitive.Root
          ref={ref}
          className={`relative h-2 w-full overflow-hidden rounded-full ${mutedColor}`}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={`h-full ${color} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </ProgressPrimitive.Root>
        <div
          className="absolute top-[-25px] text-md font-bold text-foreground"
          style={{
            left:
              percentage === 100
                ? `calc(${percentage}% - 15px)`
                : `calc(${percentage}%`,
          }} // Adjust positioning
        >
          ${rawValue}
        </div>
      </div>
    );
  }
);

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
