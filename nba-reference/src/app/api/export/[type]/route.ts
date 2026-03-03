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
 * GET handler for /api/export/{type}
 * 
 * Route Parameters:
 * - `type`: Export type - "standings", "games", or "search"
 * 
 * Query Parameters (for search type):
 * - `q`: Search query string
 * 
 * Response:
 * - Content-Type: text/csv; charset=utf-8
 * - Content-Disposition: attachment; filename="{type}.csv"
 * - Body: CSV formatted data
 * 
 * Export Types:
 * - `standings`: Returns current team standings (30 teams)
 * - `games`: Returns recent games (100 games)
 * - `search`: Returns search results for query q
 * 
 * @param req - Next.js request object
 * @param params - Promise resolving to route parameters
 * @returns CSV response with appropriate headers
 * @example
 * ```ts
 * // Export standings
 * fetch('/api/export/standings')
 * 
 * // Export search results
 * fetch('/api/export/search?q=lebron')
 * ```
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
