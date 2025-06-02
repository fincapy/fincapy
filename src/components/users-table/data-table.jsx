'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from './data-table-pagination';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { set } from 'zod';
import { TransactionContext } from './transaction';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

export function DataTable({ columns, data }) {
  const [sortingState, setSortingState] = useState([]);
  const scrollAreaRef = useRef(null);

  // Event handlers to prevent propagation
  const handleScrollEvent = useCallback((e) => {
    e.stopPropagation();
    // Also stop immediate propagation to prevent parent native event listeners
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
  }, []);

  // Add capture phase event listeners to intercept events before they bubble
  useEffect(() => {
    const scrollAreaElement = scrollAreaRef.current;
    if (!scrollAreaElement) return;

    const handleTouchEvents = (e) => {
      // Stop propagation in capture phase
      e.stopPropagation();
      // Prevent immediate propagation to other listeners
      e.stopImmediatePropagation();
    };

    // Add capture phase event listeners (true as third parameter)
    scrollAreaElement.addEventListener('touchstart', handleTouchEvents, {
      capture: true,
      passive: false,
    });
    scrollAreaElement.addEventListener('touchmove', handleTouchEvents, {
      capture: true,
      passive: false,
    });
    scrollAreaElement.addEventListener('touchend', handleTouchEvents, {
      capture: true,
      passive: false,
    });

    return () => {
      // Clean up listeners
      scrollAreaElement.removeEventListener('touchstart', handleTouchEvents, {
        capture: true,
        passive: false,
      });
      scrollAreaElement.removeEventListener('touchmove', handleTouchEvents, {
        capture: true,
        passive: false,
      });
      scrollAreaElement.removeEventListener('touchend', handleTouchEvents, {
        capture: true,
        passive: false,
      });
    };
  }, []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSortingState,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: sortingState,
      columnVisibility: {
        id: false,
      },
    },
  });

  return (
    <TransactionContext.Provider value={data}>
      <ScrollArea
        ref={scrollAreaRef}
        className="border rounded-xl w-full"
        style={{ maxHeight: '30vh' }}
        onScroll={handleScrollEvent}
        onTouchMove={handleScrollEvent}
        onTouchStart={handleScrollEvent}
        onTouchEnd={handleScrollEvent}
      >
        <Table className="text-md">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </TransactionContext.Provider>
  );
}
