/**
 * @fileoverview Sortable data table with CSV export functionality.
 * 
 * Provides a reusable table component for displaying statistical data
 * with client-side sorting and CSV export. Uses CSS custom properties
 * for consistent styling with the rest of the application.
 * 
 * @module @/components/stats-table
 */

"use client";

import { useMemo, useState } from "react";
import {
  tableBodyRowClass,
  tableCellClass,
  tableClass,
  tableContainerClass,
  tableHeadRowClass,
  tableHeaderButtonClass,
  tableHeaderCellClass,
} from "@/lib/table-styles";

/**
 * Value types that can appear in table cells.
 */
type RowValue = string | number | null;

/**
 * Represents a single row of data in the table.
 * Keys correspond to column key values.
 */
type Row = Record<string, RowValue>;

/**
 * Props for the StatsTable component.
 */
interface StatsTableProps {
  /** Column definitions with key, label, and optional alignment */
  columns: Array<{ key: string; label: string; align?: "left" | "right" }>;
  /** Array of data rows to display */
  rows: Row[];
  /** Initial column to sort by (defaults to first column) */
  initialSort?: string;
}

/**
 * Sortable data table with CSV export.
 * 
 * Features:
 * - Click column headers to sort (toggle asc/desc)
 * - Proper handling of null values (sorted to end)
 * - Case-insensitive string sorting
 * - CSV export with proper escaping
 * - Automatic row key generation for React lists
 * 
 * Sorting Algorithm:
 * 1. Null values are always sorted to the end regardless of direction
 * 2. Strings are compared case-insensitively
 * 3. Numbers are compared numerically
 * 4. Clicking the same column toggles direction
 * 5. Clicking a different column resets to descending
 * 
 * CSV Export:
 * - All values wrapped in quotes
 * - Internal quotes are doubled (RFC 4180 compliant)
 * - Filename: table-export.csv
 * - Blob URL cleaned up after download
 * 
 * @param props - Component props
 * @returns React component for the stats table
 * @example
 * ```tsx
 * <StatsTable
 *   columns={[
 *     { key: "name", label: "Player" },
 *     { key: "pts", label: "PTS", align: "right" },
 *   ]}
 *   rows={[{ name: "LeBron", pts: 25 }]}
 *   initialSort="pts"
 * />
 * ```
 */
export function StatsTable({
  columns,
  rows,
  initialSort,
}: StatsTableProps) {
  const [sortKey, setSortKey] = useState<string>(
    initialSort ?? columns[0]?.key ?? "",
  );
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  /**
   * Sorted rows based on current sort key and direction.
   * Memoized to avoid re-sorting on every render.
   */
  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      // Always sort null values to the end
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      // Case-insensitive comparison for strings
      const left = typeof av === "string" ? av.toLowerCase() : av;
      const right = typeof bv === "string" ? bv.toLowerCase() : bv;

      if (left < right) return direction === "asc" ? -1 : 1;
      if (left > right) return direction === "asc" ? 1 : -1;
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
      const primaryKey = row.id ?? row.game_id ?? row.bref_abbrev;
      // Fallback: concatenate all cell values
      const fallbackKey = columns
        .map((col) => `${row[col.key] ?? ""}`)
        .join("|");
      const baseKey =
        typeof primaryKey === "string" || typeof primaryKey === "number"
          ? `${primaryKey}`
          : `${fallbackKey}|${rowIndex}`;

      // Handle duplicate keys by appending counter
      const duplicateCount = seenKeys.get(baseKey) ?? 0;
      seenKeys.set(baseKey, duplicateCount + 1);

      return {
        row,
        rowKey:
          duplicateCount === 0 ? baseKey : `${baseKey}__dup${duplicateCount}`,
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
  const handleExportCsv = () => {
    const header = columns.map((c) => c.label).join(",");
    const lines = sorted.map((row) =>
      columns
        .map((col) => {
          const v = row[col.key];
          // Escape quotes by doubling them (RFC 4180)
          const str = v == null ? "" : String(v).replaceAll('"', '""');
          return `"${str}"`;
        })
        .join(","),
    );
    const csvData = [header, ...lines].join("\n");
    
    // Create download via Blob and temporary anchor
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "table-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL after download starts
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 250);
  };

  return (
    <div className={tableContainerClass}>
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
            {columns.map((col) => (
              <th key={col.key} className={tableHeaderCellClass(col.align)}>
                <button
                  onClick={() => {
                    if (sortKey === col.key) {
                      // Toggle direction if clicking same column
                      setDirection((d) => (d === "asc" ? "desc" : "asc"));
                    } else {
                      // New column: default to descending
                      setSortKey(col.key);
                      setDirection("desc");
                    }
                  }}
                  className={tableHeaderButtonClass}
                >
                  {col.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {keyedRows.map(({ row, rowKey }) => {
            return (
              <tr key={rowKey} className={tableBodyRowClass}>
                {columns.map((col) => (
                  <td
                    key={`${rowKey}-${col.key}`}
                    className={tableCellClass(col.align)}
                  >
                    {row[col.key] == null ? "-" : String(row[col.key])}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
