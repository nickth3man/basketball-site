/**
 * @fileoverview Sortable data table with CSV export functionality.
 *
 * Provides a reusable table component for displaying statistical data
 * with client-side sorting, optional URL-backed sort state, drill-down links,
 * and CSV export. Uses CSS custom properties for consistent styling with the
 * rest of the application.
 *
 * @module @/components/stats-table
 */

'use client';

import type { JSX } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { convertRowsToCsvWithColumns } from '@/lib/csv';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollHint } from '@/components/scroll-hint';
import { routes } from '@/lib/routes';
import { seasonIdToLeagueSlug } from '@/lib/season-utils';
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderButtonClass,
  tableHeaderCellClass,
  tableLinkClass,
} from '@/lib/table-styles';
import type { DbRows } from '@/lib/types';

type SortDirection = 'asc' | 'desc';
type SearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'> | null;
const tableUrlChangeEvent = 'stats-table-url-change';

export interface StatsTableColumnLink {
  type: 'player' | 'team' | 'league' | 'boxscore' | 'game';
  valueKey?: string;
}

export interface StatsTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right';
  link?: StatsTableColumnLink;
}

/**
 * Props for the StatsTable component.
 */
interface StatsTableProps {
  /** Column definitions with key, label, optional alignment, and optional link behavior */
  columns: StatsTableColumn[];
  /** Array of data rows to display */
  rows: DbRows;
  /** Initial column to sort by (defaults to first column) */
  initialSort?: string;
  /** Optional table id used to persist sort state in the URL */
  tableId?: string;
}

function getSortDirection(value: string | null): SortDirection {
  return value === 'asc' ? 'asc' : 'desc';
}

function getInitialSortKey(
  columns: StatsTableProps['columns'],
  initialSort: string | undefined,
  searchParams: SearchParamsLike,
  tableId: string | undefined
): string {
  if (tableId != null) {
    const paramValue = searchParams?.get(`${tableId}-sort`);
    if (paramValue != null && columns.some(column => column.key === paramValue)) {
      return paramValue;
    }
  }

  return initialSort ?? columns[0]?.key ?? '';
}

function subscribeToUrlState(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStoreChange = (): void => {
    onStoreChange();
  };

  window.addEventListener('popstate', handleStoreChange);
  window.addEventListener(tableUrlChangeEvent, handleStoreChange);

  return () => {
    window.removeEventListener('popstate', handleStoreChange);
    window.removeEventListener(tableUrlChangeEvent, handleStoreChange);
  };
}

function getSearchSnapshot(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.search;
}

function getPathnameSnapshot(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.pathname;
}

function resolveLinkedHref(
  row: DbRows[number],
  link: StatsTableColumnLink | undefined,
  columnKey: string
): Route | null {
  if (link == null) {
    return null;
  }

  const rawValue = row[link.valueKey ?? columnKey];
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    return null;
  }

  switch (link.type) {
    case 'player':
      return routes.player(rawValue.slice(0, 1), rawValue);
    case 'team':
      return routes.team(rawValue);
    case 'league': {
      const leagueSlug = seasonIdToLeagueSlug(rawValue) ?? rawValue;
      return routes.league(leagueSlug);
    }
    case 'boxscore':
      return routes.boxscore(rawValue);
    case 'game':
      return routes.game(rawValue);
  }
}

/**
 * Render a sortable data table with optional drill-down links, URL-backed sorting, and a client-side CSV export button.
 *
 * Supports per-column sorting (click header to toggle ascending/descending), places null/undefined
 * values at the end of sorted results, compares string values case-insensitively, and generates
 * stable React keys for rows. When columns are present an "Export CSV" button downloads the
 * currently sorted rows as an RFC 4180-compliant CSV.
 *
 * @param columns - Column definitions (each with `key`, `label`, and optional `align`)
 * @param rows - Table rows to display (DbRows)
 * @param initialSort - Optional initial column key to sort by; defaults to the first column key if present
 * @param tableId - Optional stable identifier for persisting sort state in the URL
 * @returns The rendered stats table element
 */
export function StatsTable({ columns, rows, initialSort, tableId }: StatsTableProps): JSX.Element {
  const hasColumns = columns.length > 0;
  const locationSearch = useSyncExternalStore(subscribeToUrlState, getSearchSnapshot, () => '');
  const pathname = useSyncExternalStore(subscribeToUrlState, getPathnameSnapshot, () => '');
  const searchParams = useMemo(() => new URLSearchParams(locationSearch), [locationSearch]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const [localSortKey, setLocalSortKey] = useState<string>(initialSort ?? columns[0]?.key ?? '');
  const [localDirection, setLocalDirection] = useState<SortDirection>('desc');
  const sortKey =
    tableId != null ? getInitialSortKey(columns, initialSort, searchParams, tableId) : localSortKey;
  const direction =
    tableId != null ? getSortDirection(searchParams.get(`${tableId}-dir`)) : localDirection;

  /**
   * Sorted rows based on current sort key and direction.
   * Memoized to avoid re-sorting on every render.
   */
  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sortKey.length === 0) {
      return copy;
    }

    copy.sort((leftRow, rightRow) => {
      const leftValue = leftRow[sortKey];
      const rightValue = rightRow[sortKey];

      // Always sort null values to the end
      if (leftValue == null && rightValue == null) return 0;
      if (leftValue == null) return 1;
      if (rightValue == null) return -1;

      // Case-insensitive comparison for strings
      const leftComparable = typeof leftValue === 'string' ? leftValue.toLowerCase() : leftValue;
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
    // Clear previous timer and revoke any pending URL
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (pendingUrlRef.current !== null) {
      URL.revokeObjectURL(pendingUrlRef.current);
      pendingUrlRef.current = null;
    }

    pendingUrlRef.current = downloadUrl;
    timeoutRef.current = setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
      pendingUrlRef.current = null;
      timeoutRef.current = null;
    }, 250);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pendingUrlRef.current !== null) {
        URL.revokeObjectURL(pendingUrlRef.current);
        pendingUrlRef.current = null;
      }
    };
  }, []);

  const persistSortInUrl = (nextSortKey: string, nextDirection: SortDirection): void => {
    if (tableId == null) {
      setLocalSortKey(nextSortKey);
      setLocalDirection(nextDirection);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set(`${tableId}-sort`, nextSortKey);
    params.set(`${tableId}-dir`, nextDirection);
    const nextPath = params.toString().length > 0 ? `${pathname}?${params.toString()}` : pathname;
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', nextPath as Route);
      window.dispatchEvent(new Event(tableUrlChangeEvent));
    }
  };

  return (
    <div className={cn(tableContainerClass, 'surface-inset rounded-lg p-1 sm:p-2')}>
      {!hasColumns ? null : (
        <>
          <div className="mb-3 flex justify-end">
            <Button onClick={handleExportCsv} size="sm" variant="ghost" className="text-link">
              Export CSV
            </Button>
          </div>

          <ScrollHint>
            <table className={tableClass}>
              <thead>
                <tr className={tableHeadRowClass}>
                  {columns.map((column, index) => (
                    <th
                      key={column.key}
                      className={tableHeaderCellClass(column.align, index === 0)}
                      aria-sort={
                        sortKey === column.key
                          ? direction === 'asc'
                            ? 'ascending'
                            : 'descending'
                          : 'none'
                      }
                    >
                      <button
                        type="button"
                        onClick={() => {
                          let nextSortKey = column.key;
                          let nextDirection: SortDirection = 'desc';

                          if (sortKey === column.key) {
                            // Toggle direction if clicking same column
                            nextDirection = direction === 'asc' ? 'desc' : 'asc';
                          } else {
                            // New column: default to descending
                            nextSortKey = column.key;
                          }

                          persistSortInUrl(nextSortKey, nextDirection);
                        }}
                        className={tableHeaderButtonClass}
                        aria-label={`Sort by ${column.label}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          <span>{column.label}</span>
                          {sortKey === column.key ? (
                            <span aria-hidden="true">{direction === 'asc' ? '▲' : '▼'}</span>
                          ) : null}
                        </span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keyedRows.map(({ row, rowKey }) => {
                  return (
                    <tr key={rowKey} className={tableBodyRowClass}>
                      {columns.map((column, index) => {
                        const rawValue = row[column.key];
                        const displayValue = rawValue == null ? '-' : String(rawValue);
                        const href = resolveLinkedHref(row, column.link, column.key);

                        return (
                          <td
                            key={`${rowKey}-${column.key}`}
                            className={tableCellClass(column.align, index === 0)}
                          >
                            {href != null && rawValue != null ? (
                              <Link className={tableLinkClass} href={href}>
                                {displayValue}
                              </Link>
                            ) : (
                              displayValue
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollHint>
        </>
      )}
    </div>
  );
}
