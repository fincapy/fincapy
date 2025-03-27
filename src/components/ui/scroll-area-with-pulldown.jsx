'use client';

import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useRef, useState, useCallback, useEffect } from 'react';
import { ArrowDownCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Loader } from 'lucide-react'; // Safari-like spinner icon

const ScrollAreaWithPulldown = React.forwardRef(
  ({ className, children, triggerRefresh, isRefreshing, ...props }, ref) => {
    const scrollRef = useRef(null);
    const contentRef = useRef(null);
    const pullRef = useRef({ startY: 0, lastY: 0, rafId: null });
    const [pullDistance, setPullDistance] = useState(0);

    const THRESHOLD = 70;
    const RESISTANCE_FACTOR = 2;

    const calculateProgressiveResistance = (distance) => {
      return distance / (1 + distance / (THRESHOLD * RESISTANCE_FACTOR));
    };

    const updatePull = useCallback((clientY) => {
      if (pullRef.current.rafId) {
        cancelAnimationFrame(pullRef.current.rafId);
      }

      pullRef.current.rafId = requestAnimationFrame(() => {
        const delta = clientY - pullRef.current.startY;
        if (delta > 0) {
          const resistance = calculateProgressiveResistance(delta);
          setPullDistance(resistance);
        } else {
          setPullDistance(0);
        }
        pullRef.current.lastY = clientY;
      });
    }, []);

    const handleTouchStart = useCallback(
      (e) => {
        if (scrollRef.current.scrollTop === 0 && !isRefreshing) {
          pullRef.current.startY = e.touches[0].clientY;
          pullRef.current.lastY = e.touches[0].clientY;

          // Reset any ongoing transitions
          if (contentRef.current) {
            contentRef.current.style.transition = 'none';
          }
        }
      },
      [isRefreshing]
    );

    const handleTouchMove = useCallback(
      (e) => {
        if (scrollRef.current?.scrollTop <= 0) {
          const touch = e.touches[0];

          updatePull(touch.clientY);
        }
      },
      [updatePull]
    );

    const handleTouchEnd = useCallback(() => {
      if (pullRef.current.rafId) {
        cancelAnimationFrame(pullRef.current.rafId);
      }

      // Add transition back for smooth return
      if (contentRef.current) {
        contentRef.current.style.transition =
          'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
      }

      if (pullDistance >= THRESHOLD) {
        triggerRefresh();
      }

      setPullDistance(0);
    }, [pullDistance, triggerRefresh]);

    // useEffect(() => {
    //   const options = { passive: false };
    //   if (scrollRef.current) {
    //     scrollRef.current.addEventListener(
    //       'touchmove',
    //       handleTouchMove,
    //       options
    //     );
    //   }
    //   return () => {
    //     if (scrollRef.current) {
    //       scrollRef.current.removeEventListener(
    //         'touchmove',
    //         handleTouchMove,
    //         options
    //       );
    //       if (pullRef.current.rafId) {
    //         cancelAnimationFrame(pullRef.current.rafId);
    //       }
    //     }
    //   };
    // }, [handleTouchMove]);

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
          onTouchMove={handleTouchMove}
        >
          {/* Pull-to-refresh indicator */}
          <div
            className={cn(
              'absolute left-0 right-0 flex justify-center items-center',
              'transition-opacity duration-200'
            )}
            style={{
              opacity: pullDistance > 20 || isRefreshing ? 1 : 0,
              top: '12px',
              display: pullDistance === 0 && !isRefreshing ? 'none' : 'flex',
            }}
          >
            <div
              className={cn(
                'absolute left-0 right-0 flex justify-center items-center',
                'transition-opacity duration-200'
              )}
              style={{
                opacity: pullDistance > 20 || isRefreshing ? 1 : 0,
                top: '12px',
                height: pullDistance === 0 ? 0 : 'auto',
                display: pullDistance === 0 && !isRefreshing ? 'none' : 'flex',
              }}
            >
              <div
                className={cn(
                  'relative w-6 h-6', // Smaller loader
                  isRefreshing ? 'animate-spin' : ''
                )}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  animation: isRefreshing
                    ? 'spin 0.8s linear infinite'
                    : 'none',
                }}
              >
                {Array.from({ length: 8 }).map((_, index) => {
                  const angle = (360 / 8) * index; // Divide into 8 petals
                  const isVisible = pullDistance / THRESHOLD >= index / 8; // Reveal petals progressively
                  return (
                    <div
                      key={index}
                      style={{
                        position: 'absolute',
                        width: '2px',
                        height: '6px', // Smaller, crisper petal
                        backgroundColor:
                          isVisible || isRefreshing ? '#134e4a' : 'gray',
                        borderRadius: '1px',
                        transform: `rotate(${angle}deg) translateY(-8px)`,
                        transition: 'background-color 0.2s',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content with transform */}
          <div
            ref={contentRef}
            className="relative will-change-transform"
            style={{
              transform: `translate3d(0, ${isRefreshing ? THRESHOLD / 1.5 : pullDistance}px, 0)`,
            }}
          >
            {children}
          </div>
        </ScrollAreaPrimitive.Viewport>
        <ScrollBarWithPulldown />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    );
  }
);

const ScrollBarWithPulldown = React.forwardRef(
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

export { ScrollAreaWithPulldown, ScrollBarWithPulldown };
