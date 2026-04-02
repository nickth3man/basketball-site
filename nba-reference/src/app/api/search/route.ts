/**
 * @fileoverview Search API endpoint - handles entity search requests.
 *
 * Provides a GET endpoint that accepts a query parameter and returns
 * matching players and teams. Validates minimum query length before
 * executing search to prevent unnecessary database queries.
 *
 * @module @/app/api/search/route
 */

import {
  createApiErrorResponse,
  createApiJsonResponse,
  createApiOptionsResponse,
  logApiError,
} from '@/lib/api-response';
import {
  normalizeSearchQuery,
  parseSearchResultType,
  SEARCH_API_RESULT_LIMIT,
  searchEntities,
} from '@/lib/query/search';
import type { NextRequest } from 'next/server';

export function OPTIONS(): Response {
  return createApiOptionsResponse();
}

/**
 * Handle GET requests to /api/search and return matching players and teams for the provided query.
 *
 * If the `q` query parameter is omitted or shorter than 2 characters,
 * the response contains an empty `results` array; otherwise `results` contains matching entities.
 *
 * @param req - Next.js request whose URL may include the `q` query parameter (search text)
 * @returns An object with a `results` array of search entries, each entry having fields such as `type`, `id`, and `label`
 */
export function GET(req: NextRequest): Response {
  try {
    const query = normalizeSearchQuery(req.nextUrl.searchParams.get('q'));
    const matchedType = parseSearchResultType(req.nextUrl.searchParams.get('type'));

    if (query.length < 2) {
      return createApiJsonResponse(req, {
        meta: {
          limit: SEARCH_API_RESULT_LIMIT,
          query,
          type: null,
        },
        results: [],
      });
    }

    return createApiJsonResponse(req, {
      meta: {
        limit: SEARCH_API_RESULT_LIMIT,
        query,
        type: matchedType ?? null,
      },
      results: searchEntities(
        query,
        matchedType != null
          ? { limit: SEARCH_API_RESULT_LIMIT, types: [matchedType] }
          : { limit: SEARCH_API_RESULT_LIMIT }
      ),
    });
  } catch (error) {
    logApiError('search', error, {
      query: normalizeSearchQuery(req.nextUrl.searchParams.get('q')),
      type: parseSearchResultType(req.nextUrl.searchParams.get('type')) ?? null,
    });
    return createApiErrorResponse(
      req,
      500,
      'search_failed',
      'Search results are temporarily unavailable.'
    );
  }
}
