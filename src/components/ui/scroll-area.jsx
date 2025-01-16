'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useRef, useState } from 'react';

import { cn } from '@/lib/utils';

const ScrollArea = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    const scrollRef = useRef(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);

    const THRESHOLD = 60; // The distance required to trigger a refresh
    const MAX_PULL_DISTANCE = 100; // Max pull distance for visual feedback

    const handleTouchStart = (e) => {
      const scrollElement = scrollRef.current;
      if (scrollElement.scrollTop === 0 && !isRefreshing) {
        scrollElement.startY = e.touches[0].clientY;
        scrollElement.isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      const scrollElement = scrollRef.current;
      if (scrollElement.isPulling) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - scrollElement.startY;

        if (distance > 0) {
          e.preventDefault(); // Prevent scrolling
          setPullDistance(Math.min(distance, MAX_PULL_DISTANCE));
        } else {
          scrollElement.isPulling = false;
        }
      }
    };

    const handleTouchEnd = () => {
      const scrollElement = scrollRef.current;
      if (scrollElement.isPulling) {
        scrollElement.isPulling = false;

        if (pullDistance >= THRESHOLD) {
          setIsRefreshing(true);
          onRefresh().finally(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          });
        } else {
          setPullDistance(0);
        }
      }
    };

    return (
      <ScrollAreaPrimitive.Root
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn('overflow-hidden relative', className)}
        {...props}
      >
        <div
          style={{
            height: pullDistance,
            background: 'lightblue',
            textAlign: 'center',
            lineHeight: `${pullDistance}px`,
            fontSize: '14px',
            transition: isRefreshing ? 'none' : 'height 0.2s ease',
          }}
        >
          {pullDistance > 0 && !isRefreshing && 'Pull to refresh...'}
          {isRefreshing && 'Refreshing...'}
        </div>
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
          {children}
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
