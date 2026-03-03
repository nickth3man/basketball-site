/**
 * @fileoverview CSV export API endpoint - exports data as downloadable CSV files.
 * 
 * Provides a GET endpoint that exports various data types as CSV:
 * - standings: Team standings table
 * - games: Recent games list
 * - search: Search results (requires q parameter)
 * 
 * All CSV output uses RFC 4180 compliant formatting with quoted fields.
 * 
 * @module @/app/api/export/[type]/route
 */

import { getHomeStandings, getRecentGames } from "@/lib/query/home";
import { searchEntities } from "@/lib/query/search";
import { NextRequest } from "next/server";

/**
 * Converts an array of records to CSV format.
 * 
 * CSV Formatting Rules (RFC 4180 compliant):
 * - All values wrapped in double quotes
 * - Internal double quotes escaped by doubling (" → "")
 * - Null/undefined values output as empty strings
 * - Header row uses object keys
 * 
 * @param rows - Array of records to convert
 * @returns CSV string with header and data rows
 * @example
 * ```ts
 * const csv = toCsv([{ name: "LeBron", pts: 25 }]);
 * // "name","pts"
 * // "LeBron","25"
 * ```
 */
function toCsv(rows: Array<Record<string, string | number | null>>) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const out = [headers.join(",")];

  for (const row of rows) {
    out.push(
      headers
        .map((h) => {
          const v = row[h];
          // Escape quotes by doubling them (RFC 4180)
          const str = v == null ? "" : String(v).replaceAll('"', '""');
          return `"${str}"`;
        })
        .join(","),
    );
  }

  return out.join("\n");
}

/**
 * Handle GET requests to export data as a CSV file for "standings", "games", or "search".
 *
 * For `standings` returns current team standings (30 teams). For `games` returns recent games (100 games).
 * For `search` reads query parameter `q` from the request URL and returns matching search results.
 *
 * @param req - Next.js request object (used to read query parameter `q` for search)
 * @param params - Promise resolving to route parameters with `type` set to "standings" | "games" | "search"
 * @returns A CSV response whose body is the exported data and headers include `Content-Type: text/csv; charset=utf-8`
 *          and `Content-Disposition: attachment; filename="{type}.csv"`
 */
export function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  return params.then(({ type }) => {
    let rows: Array<Record<string, string | number | null>> = [];

    if (type === "standings")
      rows = getHomeStandings(30) as Array<
        Record<string, string | number | null>
      >;
    if (type === "games")
      rows = getRecentGames(100) as Array<
        Record<string, string | number | null>
      >;
    if (type === "search") {
      const q = req.nextUrl.searchParams.get("q") ?? "";
      rows = searchEntities(q) as Array<Record<string, string | number | null>>;
    }

    const csv = toCsv(rows);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${type}.csv"`,
      },
    });
  });
}
