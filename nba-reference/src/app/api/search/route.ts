/**
 * @fileoverview Search API endpoint - handles entity search requests.
 * 
 * Provides a GET endpoint that accepts a query parameter and returns
 * matching players and teams. Validates minimum query length before
 * executing search to prevent unnecessary database queries.
 * 
 * @module @/app/api/search/route
 */

import { searchEntities } from "@/lib/query/search";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler for /api/search?q={query}
 * 
 * Query Parameters:
 * - `q`: Search query string (minimum 2 characters)
 * 
 * Response:
 * ```json
 * {
 *   "results": [
 *     { "type": "player", "id": "jamesle01", "label": "LeBron James" },
 *     { "type": "team", "id": "LAL", "label": "Los Angeles Lakers" }
 *   ]
 * }
 * ```
 * 
 * Validation:
 * - Returns empty results array if query is less than 2 characters
 * - This prevents excessive short queries and improves performance
 * 
 * @param req - Next.js request object
 * @returns JSON response with search results
 * @example
 * ```ts
 * // Request: /api/search?q=lebron
 * // Response: { results: [...] }
 * ```
 */
export function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({ results: searchEntities(q) });
}
