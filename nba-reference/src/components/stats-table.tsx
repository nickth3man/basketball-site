"use client";

import { useMemo, useState } from "react";

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
  const [sortKey, setSortKey] = useState<string>(initialSort ?? columns[0]?.key ?? "");
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

  const csvData = useMemo(() => {
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
    return [header, ...lines].join("\n");
  }, [columns, sorted]);

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex justify-end">
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvData)}`}
          download="table-export.csv"
          className="rounded border border-[#b8ab8f] bg-[#f6f3ea] px-2 py-1 text-xs text-[#3b3428] hover:bg-[#ece5d7]"
        >
          Export CSV
        </a>
      </div>
      <table className="min-w-full border-collapse text-xs text-[#222]">
        <thead>
          <tr className="bg-[#ece5d7]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`border border-[#b8ab8f] px-2 py-1 ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                <button
                  onClick={() => {
                    if (sortKey === col.key) {
                      setDirection((d) => (d === "asc" ? "desc" : "asc"));
                    } else {
                      setSortKey(col.key);
                      setDirection("desc");
                    }
                  }}
                  className="w-full cursor-pointer"
                >
                  {col.label}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#faf8f2]"}>
              {columns.map((col) => (
                <td
                  key={`${i}-${col.key}`}
                  className={`border border-[#d2c8b3] px-2 py-1 ${
                    col.align === "right" ? "text-right tabular-nums" : "text-left"
                  }`}
                >
                  {row[col.key] == null ? "-" : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
