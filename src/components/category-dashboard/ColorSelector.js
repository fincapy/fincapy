'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

// Using the progressBarColors from the main category dashboard component
const colorOptions = {
  amber: 'bg-amber-500', // primary
  emerald: 'bg-emerald-500', // secondary
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
};

export function getRandomColor() {
  const colorNames = Object.keys(colorOptions);
  const randomIndex = Math.floor(Math.random() * colorNames.length);
  return colorNames[randomIndex];
}

const ColorSelector = ({ value, onChange }) => {
  const handleColorSelect = (colorName) => {
    onChange(colorName);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {Object.entries(colorOptions).map(([colorName, colorClass]) => (
        <button
          key={colorName}
          type="button"
          className={cn(
            colorClass,
            'w-8 h-8 rounded-full flex items-center justify-center transition-all',
            value === colorName
              ? 'ring-2 ring-black ring-offset-2'
              : 'hover:opacity-90'
          )}
          onClick={() => handleColorSelect(colorName)}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {value === colorName && <Check className="h-4 w-4 text-white" />}
        </button>
      ))}
    </div>
  );
};

export { ColorSelector, colorOptions };
