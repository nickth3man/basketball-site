/**
 * @fileoverview Sortable data table with CSV export functionality.
 *
 * Provides a reusable table component for displaying statistical data
 * with client-side sorting and CSV export. Uses CSS custom properties
 * for consistent styling with the rest of the application.
 *
 * @module @/components/stats-table
 */

'use client';

import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { convertRowsToCsvWithColumns } from '@/lib/csv';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderButtonClass,
  tableHeaderCellClass,
} from '@/lib/table-styles';
import type { DbRows } from '@/lib/types';

/**
 * Props for the StatsTable component.
 */
interface StatsTableProps {
  /** Column definitions with key, label, and optional alignment */
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>;
  /** Array of data rows to display */
  rows: DbRows;
  /** Initial column to sort by (defaults to first column) */
  initialSort?: string;
}

/**
 * Render a sortable data table with a client-side CSV export button.
 *
 * Supports click-to-sort per column (toggles ascending/descending), sorts nulls to the end,
 * compares strings case-insensitively and numbers numerically, and generates stable React row keys.
 *
 * CSV export produces RFC 4180-compliant output (all fields wrapped in double quotes; internal quotes doubled),
 * triggers a download named "table-export.csv", and revokes the temporary Blob URL after download.
 *
 * @param props - Component props
 * @returns The rendered stats table element
 */
export function StatsTable({ columns, rows, initialSort }: StatsTableProps): JSX.Element {
  const hasColumns = columns.length > 0;
  const [sortKey, setSortKey] = useState<string>(initialSort ?? columns[0]?.key ?? '');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Sorted rows based on current sort key and direction.
   * Memoized to avoid re-sorting on every render.
   */
  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((leftRow, rightRow) => {
      const leftValue = leftRow[sortKey];
      const rightValue = rightRow[sortKey];

      // Always sort null values to the end
      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;

      // Case-insensitive comparison for strings
      const leftComparable =
        typeof leftValue === 'string' ? leftValue.toLowerCase() : leftValue;
      const rightComparable =
        typeof rightValue === 'string' ? rightValue.toLowerCase() : rightValue;

      if (leftComparable < rightComparable) return direction === 'asc' ? -1 : 1;
      if (leftComparable > rightComparable) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, direction]);

  /**
   * Rows with generated React keys.
   *
   * Key generation strategy:
   * 1. Try to use natural ID fields (id, game_id, bref_abbrev)
   * 2. Fall back to concatenating all column values
   * 3. Deduplicate by appending __dup{N} suffix for identical rows
   */
  const keyedRows = useMemo(() => {
    const seenKeys = new Map<string, number>();

    return sorted.map((row, rowIndex) => {
      // Try natural IDs first
      const primaryKey = row['id'] ?? row['game_id'] ?? row['bref_abbrev'];
      // Fallback: concatenate all cell values
      const fallbackKey = columns.map(column => `${row[column.key] ?? ''}`).join('|');
      const baseKey =
        typeof primaryKey === 'string' || typeof primaryKey === 'number'
          ? `${primaryKey}`
          : `${fallbackKey}|${rowIndex}`;

      // Handle duplicate keys by appending counter
      const duplicateCount = seenKeys.get(baseKey) ?? 0;
      seenKeys.set(baseKey, duplicateCount + 1);

      return {
        row,
        rowKey: duplicateCount === 0 ? baseKey : `${baseKey}__dup${duplicateCount}`,
      };
    });
  }, [columns, sorted]);

  /**
   * Exports the currently sorted data as a CSV file.
   *
   * CSV Format:
   * - Comma-separated values
   * - All fields wrapped in double quotes
   * - Internal quotes escaped by doubling (" → "")
   * - Download triggered via temporary anchor element
   * - Blob URL revoked after 250ms to free memory
   */
  const handleExportCsv = (): void => {
    const csvData = convertRowsToCsvWithColumns(sorted, columns);

    // Create download via Blob and temporary anchor
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'table-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up blob URL after download starts
    // Clear previous timer if exists
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
      timeoutRef.current = null;
    }, 250);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={tableContainerClass}>
      {!hasColumns ? null : (
        <>
          {/* CSV Export button */}
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={handleExportCsv}
              className="rounded border border-line bg-button-bg px-2 py-1 text-xs text-muted-strong transition-all duration-200 hover:-translate-y-0.5 hover:bg-button-hover active:translate-y-0 active:scale-[0.98]"
            >
              Export CSV
            </button>
          </div>

          {/* Data table */}
          <table className={tableClass}>
            <thead>
              <tr className={tableHeadRowClass}>
                {columns.map(column => (
                  <th key={column.key} className={tableHeaderCellClass(column.align)}>
                    <button
                      onClick={() => {
                        if (sortKey === column.key) {
                          // Toggle direction if clicking same column
                          setDirection(currentDirection =>
                            currentDirection === 'asc' ? 'desc' : 'asc'
                          );
                        } else {
                          // New column: default to descending
                          setSortKey(column.key);
                          setDirection('desc');
                        }
                      }}
                      className={tableHeaderButtonClass}
                    >
                      {column.label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keyedRows.map(({ row, rowKey }) => {
                return (
                  <tr key={rowKey} className={tableBodyRowClass}>
                    {columns.map(column => (
                      <td key={`${rowKey}-${column.key}`} className={tableCellClass(column.align)}>
                        {row[column.key] == null ? '-' : String(row[column.key])}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
