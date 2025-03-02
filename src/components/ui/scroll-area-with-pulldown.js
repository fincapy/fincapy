"use client";

import { useRef, useState, useEffect } from "react";
import { ScrollArea } from "./scroll-area";

export function ScrollAreaWithPulldown({
  children,
  className,
  onPulldownRelease,
  pulldownThreshold = 100, // The threshold in pixels to trigger onPulldownRelease
  maxPulldownDistance = 120, // Maximum distance user can pull down
  ...props
}) {
  const [isPullingDown, setIsPullingDown] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isContentScrollable, setIsContentScrollable] = useState(false);
  const [startY, setStartY] = useState(0);
  const scrollViewport = useRef(null);
  const contentRef = useRef(null);

  // Check if content is scrollable
  useEffect(() => {
    if (scrollViewport.current && contentRef.current) {
      const checkScrollable = () => {
        const viewport = scrollViewport.current;
        const content = contentRef.current;
        if (viewport && content) {
          // Content is scrollable if its height is greater than viewport height
          setIsContentScrollable(content.scrollHeight > viewport.clientHeight);
        }
      };

      checkScrollable();
      // Recheck on resize
      window.addEventListener('resize', checkScrollable);
      return () => window.removeEventListener('resize', checkScrollable);
    }
  }, [children]);

  const handleTouchStart = (e) => {
    // Only initiate pulldown if at the top of the scroll area
    if (scrollViewport.current && scrollViewport.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsPullingDown(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPullingDown) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    // Only allow pulldown if difference is positive (pulling down)
    if (diff > 0) {
      // Apply resistance, especially when content is scrollable
      const resistance = isContentScrollable ? 0.3 : 0.5;
      const newDistance = Math.min(diff * resistance, maxPulldownDistance);
      setPullDistance(newDistance);
      e.preventDefault(); // Prevent default scrolling
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingDown) return;
    
    if (pullDistance >= pulldownThreshold) {
      onPulldownRelease && onPulldownRelease();
    }
    
    // Reset state and animate back
    setIsPullingDown(false);
    setPullDistance(0);
  };

  return (
    <div
      style={{ position: "relative", overflow: "hidden", touchAction: "none" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPullingDown ? "none" : "transform 0.3s ease-out",
        }}
      >
        <ScrollArea
          className={className}
          {...props}
          ref={(el) => {
            // Apply the ref to the scrollViewport
            if (el) {
              scrollViewport.current = el.querySelector('[data-radix-scroll-area-viewport]');
            }
          }}
        >
          <div ref={contentRef}>
            {children}
          </div>
        </ScrollArea>
      </div>
      
      {pullDistance > 0 && (
        <div 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: Math.min(pullDistance / pulldownThreshold, 1),
          }}
        >
          {pullDistance >= pulldownThreshold ? "Release to refresh" : "Pull down to refresh"}
        </div>
      )}
    </div>
  );
}
