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
 * Handle GET requests to /api/search and return matching players and teams for the provided query.
 *
 * May short-circuit with a rate-limit response. If the `q` query parameter is omitted or shorter than 2 characters,
 * the response contains an empty `results` array; otherwise `results` contains matching entities.
 *
 * @param req - Next.js request whose URL may include the `q` query parameter (search text)
 * @returns An object with a `results` array of search entries, each entry having fields such as `type`, `id`, and `label`
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
