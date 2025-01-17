'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowDownCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

const ScrollArea = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const scrollRef = useRef(null);
    const [pullState, setPullState] = useState({
      distance: 0,
      isRefreshing: false,
    });

    // Constants
    const THRESHOLD = 80; // Distance required to trigger refresh
    const MAX_PULL_DISTANCE = 100; // Maximum pull distance
    const RESISTANCE_FACTOR = 0.1; // Reduces pull distance for more resistance

    const onRefresh = useCallback(() => {
      console.log('Refreshing...');
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('Refreshed!');
          resolve();
        }, 1000);
      });
    }, []);

    // Calculate the actual distance with resistance
    const calculateResistance = (distance) => {
      return Math.min(distance * RESISTANCE_FACTOR, MAX_PULL_DISTANCE);
    };

    // Calculate opacity based on pull distance
    const getOpacity = () => {
      return Math.min(pullState.distance / THRESHOLD, 1);
    };

    // Calculate rotation based on pull distance
    const getRotation = () => {
      return Math.min((pullState.distance / THRESHOLD) * 180, 180);
    };

    const handleTouchStart = (e) => {
      const scrollElement = scrollRef.current;
      if (scrollElement.scrollTop === 0 && !pullState.isRefreshing) {
        scrollElement.startY = e.touches[0].clientY;
        scrollElement.isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      const scrollElement = scrollRef.current;
      if (scrollElement.isPulling && scrollElement.scrollTop === 0) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - scrollElement.startY;

        if (distance > 0) {
          e.preventDefault();
          const resistedDistance = calculateResistance(distance);
          setPullState((prev) => ({
            ...prev,
            distance: resistedDistance,
          }));
        } else {
          scrollElement.isPulling = false;
          setPullState((prev) => ({ ...prev, distance: 0 }));
        }
      }
    };

    const handleTouchEnd = async () => {
      const scrollElement = scrollRef.current;
      if (scrollElement.isPulling) {
        scrollElement.isPulling = false;

        if (pullState.distance >= THRESHOLD) {
          setPullState((prev) => ({ ...prev, isRefreshing: true }));
          await onRefresh();
          setPullState({ distance: 0, isRefreshing: false });
        } else {
          // Animate back to 0
          setPullState((prev) => ({ ...prev, distance: 0 }));
        }
      }
    };

    useEffect(() => {
      document.addEventListener('touchmove', handleTouchMove, {
        passive: false,
      });
      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
      };
    }, []);

    return (
      <ScrollAreaPrimitive.Root
        className={cn('overflow-hidden relative', className)}
        {...props}
      >
        <ScrollAreaPrimitive.Viewport
          ref={scrollRef}
          className="h-full w-full rounded-[inherit]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pull to refresh indicator - Now with z-index */}
          <div
            className="absolute left-0 right-0 flex justify-center items-center transition-transform z-50 top-3"
            style={{
              // transform: `translateY(${pullState.distance}px)`,
              // transition: pullState.isPulling
              //   ? 'none'
              //   : 'transform 0.2s ease-out',
              display: pullState.distance > 25 ? 'block' : 'none',
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <ArrowDownCircle
                className="transition-all"
                style={{
                  opacity: getOpacity(),
                  transform: `rotate(${getRotation()}deg)`,
                  color:
                    pullState.distance >= THRESHOLD ? 'green' : 'currentColor',
                }}
              />
              {/* <span className="text-sm">
                {pullState.isRefreshing
                  ? 'Refreshing...'
                  : pullState.distance >= THRESHOLD
                    ? 'Release to refresh'
                    : 'Pull to refresh'}
              </span> */}
            </div>
          </div>

          {/* Content wrapper - Now with relative positioning and background */}
          <div
            className="relative bg-background"
            style={{
              transform: `translateY(${pullState.distance}px)`,
              transition: pullState.isPulling
                ? 'none'
                : 'transform 0.2s ease-out',
            }}
          >
            {children}
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  }
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = React.forwardRef(
  ({ className, orientation = 'vertical', ...props }, ref) => (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      ref={ref}
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-colors',
        orientation === 'vertical' &&
          'h-full w-2.5 border-l border-l-transparent p-[1px]',
        orientation === 'horizontal' &&
          'h-2.5 flex-col border-t border-t-transparent p-[1px]',
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
