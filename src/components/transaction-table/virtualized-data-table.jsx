'use client';

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
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
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { TransactionContext } from './transaction';
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualizedDataTable({ columns, data }) {
  const [sortingState, setSortingState] = useState([]);
  const [columnWidths, setColumnWidths] = useState({});
  const scrollAreaRef = useRef(null);
  const parentRef = useRef(null);
  const headerRef = useRef(null);

  // Event handlers to prevent propagation
  const handleScrollEvent = useCallback((e) => {
    e.stopPropagation();
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }
  }, []);

  // Add capture phase event listeners to intercept events before they bubble
  useEffect(() => {
    const scrollAreaElement = scrollAreaRef.current;
    if (!scrollAreaElement) return;

    const handleTouchEvents = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    };

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
        transactionId: false,
        categoryId: false,
        subcategoryId: false,
      },
    },
  });

  const { rows } = table.getRowModel();

  // Calculate column widths from header after initial render
  useEffect(() => {
    const calculateColumnWidths = () => {
      if (headerRef.current && table.getHeaderGroups().length > 0) {
        const headerRow = headerRef.current.querySelector('tr');
        if (headerRow) {
          const headerCells = headerRow.querySelectorAll('th');
          const widths = {};

          headerCells.forEach((cell, index) => {
            const header = table.getHeaderGroups()[0].headers[index];
            if (header) {
              widths[header.id] = cell.offsetWidth;
            }
          });

          setColumnWidths(widths);
        }
      }
    };

    // Calculate widths initially
    calculateColumnWidths();

    // Use ResizeObserver to recalculate on resize
    const resizeObserver = new ResizeObserver(() => {
      calculateColumnWidths();
    });

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    // Also recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateColumnWidths, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [table, data]);

  // Virtualization setup
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Estimated row height in pixels
    overscan: 10, // Number of items to render outside the visible area
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <TransactionContext.Provider value={data}>
      <div className="border rounded-xl w-full overflow-hidden">
        {/* Fixed header */}
        <div className="bg-background border-b">
          <Table
            className="text-md"
            ref={headerRef}
            style={{ tableLayout: 'fixed', width: '100%' }}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-md">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
          </Table>
        </div>

        {/* Virtualized scrollable body */}
        <div
          ref={parentRef}
          className="overflow-auto"
          style={{ height: 'calc(70vh - 60px)' }} // Adjust for header height
          onScroll={handleScrollEvent}
          onTouchMove={handleScrollEvent}
          onTouchStart={handleScrollEvent}
          onTouchEnd={handleScrollEvent}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            <Table
              className="text-md"
              style={{ tableLayout: 'fixed', width: '100%' }}
            >
              <TableBody>
                {virtualItems.length > 0 ? (
                  virtualItems.map((virtualItem) => {
                    const row = rows[virtualItem.index];
                    return (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && 'selected'}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            style={{
                              width: columnWidths[cell.column.id] || 'auto',
                              minWidth: columnWidths[cell.column.id]
                                ? `${columnWidths[cell.column.id]}px`
                                : '100px',
                              maxWidth: columnWidths[cell.column.id] || 'auto',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })
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
          </div>
        </div>
      </div>
    </TransactionContext.Provider>
  );
}
