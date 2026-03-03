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

type RowValue = string | number | null;
type Row = Record<string, RowValue>;

export function StatsTable({
  columns,
  rows,
  initialSort,
}: {
  columns: Array<{ key: string; label: string; align?: "left" | "right" }>;
  rows: Row[];
  initialSort?: string;
}) {
  const [sortKey, setSortKey] = useState<string>(
    initialSort ?? columns[0]?.key ?? "",
  );
  const [direction, setDirection] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      const left = typeof av === "string" ? av.toLowerCase() : av;
      const right = typeof bv === "string" ? bv.toLowerCase() : bv;

      if (left < right) return direction === "asc" ? -1 : 1;
      if (left > right) return direction === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [rows, sortKey, direction]);

  const keyedRows = useMemo(() => {
    const seenKeys = new Map<string, number>();

    return sorted.map((row, rowIndex) => {
      const primaryKey = row.id ?? row.game_id ?? row.bref_abbrev;
      const fallbackKey = columns
        .map((col) => `${row[col.key] ?? ""}`)
        .join("|");
      const baseKey =
        typeof primaryKey === "string" || typeof primaryKey === "number"
          ? `${primaryKey}`
          : `${fallbackKey}|${rowIndex}`;

      const duplicateCount = seenKeys.get(baseKey) ?? 0;
      seenKeys.set(baseKey, duplicateCount + 1);

      return {
        row,
        rowKey:
          duplicateCount === 0 ? baseKey : `${baseKey}__dup${duplicateCount}`,
      };
    });
  }, [columns, sorted]);

  const handleExportCsv = () => {
    const header = columns.map((c) => c.label).join(",");
    const lines = sorted.map((row) =>
      columns
        .map((col) => {
          const v = row[col.key];
          const str = v == null ? "" : String(v).replaceAll('"', '""');
          return `"${str}"`;
        })
        .join(","),
    );
    const csvData = [header, ...lines].join("\n");
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "table-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 250);
  };

  return (
    <div className={tableContainerClass}>
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={handleExportCsv}
          className="rounded border border-line bg-button-bg px-2 py-1 text-xs text-muted-strong transition-all duration-200 hover:-translate-y-0.5 hover:bg-button-hover active:translate-y-0 active:scale-[0.98]"
        >
          Export CSV
        </button>
      </div>
      <table className={tableClass}>
        <thead>
          <tr className={tableHeadRowClass}>
            {columns.map((col) => (
              <th key={col.key} className={tableHeaderCellClass(col.align)}>
                <button
                  onClick={() => {
                    if (sortKey === col.key) {
                      setDirection((d) => (d === "asc" ? "desc" : "asc"));
                    } else {
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
