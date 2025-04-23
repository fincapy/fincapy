'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { useAtom } from 'jotai';
import { planAtom } from '../state/atoms';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef(
  (
    {
      className,
      progressPercent,
      rawValue,
      goal,
      color,
      mutedColor,
      barHeight,
      rawValueSize,
      ...props
    },
    ref // ref is an object, not a function
  ) => {
    const [progressBarWidth, setProgressBarWidth] = React.useState(0);
    const progressBarRef = React.useRef(null);

    const [plan] = useAtom(planAtom);

    let percentage = Math.min(Math.max(progressPercent, 0), 100);
    if (rawValue === 0 && goal === 0) {
      percentage = 100;
    }

    React.useEffect(() => {
      if (progressBarRef.current) {
        setProgressBarWidth(progressBarRef.current.offsetWidth);
      }

      const handleResize = () => {
        if (progressBarRef.current) {
          setProgressBarWidth(progressBarRef.current.offsetWidth);
        }
      };

      window.addEventListener('resize', handleResize);

      return () => window.removeEventListener('resize', handleResize);
    }, []);

    const calculateRawValuePosition = () => {
      const rawValueWidth = rawValue.toFixed(2).toString().length * 8; // Approximate width based on font size
      const position =
        (progressBarWidth * percentage) / 100 - rawValueWidth / 2;

      // Adjust position to keep the raw value within the progress bar bounds
      const minPosition = 0;
      const maxPosition = progressBarWidth - rawValueWidth;
      return Math.max(minPosition, Math.min(position, maxPosition));
    };

    // Merge the forwarded ref and internal ref
    const mergedRef = (node) => {
      progressBarRef.current = node;

      if (typeof ref === 'function') {
        ref(node);
      } else if (ref !== null) {
        ref.current = node;
      }
    };

    return (
      <div className="relative w-full">
        <ProgressPrimitive.Root
          ref={mergedRef} // Use the mergedRef
          className={`relative ${barHeight} w-full overflow-hidden rounded-full ${mutedColor}`}
          {...props}
        >
          <ProgressPrimitive.Indicator
            className={`h-full ${color} transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </ProgressPrimitive.Root>
        {/* <div
          className={`absolute top-[11px] left-0 ${rawValueSize} font-bold text-primary transition-opacity duration-200`}
          style={{
            left: `${calculateRawValuePosition()}px`,
            // opacity: isHovered ? 1 : 0,
          }}
        >
          {new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(rawValue)}
        </div> */}
      </div>
    );
  }
);

Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
