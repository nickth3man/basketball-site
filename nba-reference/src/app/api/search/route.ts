/**
 * @fileoverview Search API endpoint - handles entity search requests.
 *
 * Provides a GET endpoint that accepts a query parameter and returns
 * matching players and teams. Validates minimum query length before
 * executing search to prevent unnecessary database queries.
 *
 * @module @/app/api/search/route
 */

import { searchEntities } from '@/lib/query/search';
import { checkRateLimit } from '@/middleware/rate-limit';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Handle GET requests to /api/search and return matching search results.
 *
 * Enforces a minimum query length of 2 characters; if the `q` parameter is shorter than 2 characters
 * the response contains an empty `results` array. When `q` is 2 or more characters, returns search
 * results produced from the query.
 *
 * @param req - Next.js request object containing the `q` query parameter
 * @returns An object with a `results` array of search entries (e.g. `{ type: string, id: string, label: string }`)
 */
export function GET(req: NextRequest): NextResponse {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  return NextResponse.json({ results: searchEntities(query) });
}
