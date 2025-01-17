'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowDownCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Loader } from 'lucide-react'; // Safari-like spinner icon

const ScrollArea = React.forwardRef(
  ({ className, children, triggerRefresh, isRefreshing, ...props }, ref) => {
    const scrollRef = useRef(null);
    const [pullState, setPullState] = useState({
      distance: 0,
    });

    // Constants
    const THRESHOLD = 70; // Distance required to trigger refresh
    const RESISTANCE_FACTOR = 2; // Controls resistance scaling

    const calculateProgressiveResistance = (distance) => {
      return distance / (1 + distance / (THRESHOLD * RESISTANCE_FACTOR));
    };

    const handleTouchStart = (e) => {
      const scrollElement = scrollRef.current;
      if (scrollElement.scrollTop === 0 && !isRefreshing) {
        scrollElement.startY = e.touches[0].clientY;
        scrollElement.isPulling = true;
      }
    };

    const handleTouchMove = (e) => {
      const scrollElement = scrollRef.current;
      if (scrollElement.isPulling && scrollElement.scrollTop <= 0) {
        const currentY = e.touches[0].clientY;
        const distance = currentY - scrollElement.startY;

        if (distance > 0) {
          e.preventDefault();
          const resistedDistance = calculateProgressiveResistance(distance);
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
          setPullState((prev) => ({
            ...prev,
            distance: THRESHOLD,
          }));
          triggerRefresh();
          setPullState({ distance: 0 });
        } else {
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
          {/* Pull-to-refresh indicator */}
          <div
            className="absolute left-0 right-0 flex justify-center items-center z-50 top-3"
            style={{
              display:
                pullState.distance > 20 || isRefreshing ? 'flex' : 'none',
              color: pullState.distance >= THRESHOLD ? 'green' : 'currentColor',
              opacity: isRefreshing
                ? 1
                : Math.min(pullState.distance / THRESHOLD, 1),
              transition: isRefreshing
                ? 'opacity 0.3s ease-out, transform 0.3s ease-out'
                : 'transform 0.2s ease-out',
            }}
          >
            <Loader
              className={
                isRefreshing
                  ? 'animate-spin text-gray-600 transition-all'
                  : 'text-gray-400 transition-all'
              }
              style={{
                color:
                  pullState.distance >= THRESHOLD || isRefreshing
                    ? 'green'
                    : 'currentColor',
              }}
            />
          </div>

          {/* Content */}
          <div
            className="relative bg-background"
            style={{
              transform: isRefreshing
                ? `translateY(${THRESHOLD / 2}px)` // Compress pulled-down space more
                : `translateY(${pullState.distance}px)`,
              transition: pullState.isPulling
                ? 'none'
                : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
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
