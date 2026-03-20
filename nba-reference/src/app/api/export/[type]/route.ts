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

import { createApiErrorResponse, createApiOptionsResponse, logApiError } from '@/lib/api-response';
import { API_CORS_HEADERS, API_NO_STORE_HEADERS } from '@/lib/api-headers';
import { convertRowsToCsv, castToDbRows } from '@/lib/csv';
import { getHomeStandings, getRecentGames } from '@/lib/query/home';
import { searchEntities } from '@/lib/query/search';
import type { DbRows } from '@/lib/types';
import {
  checkRateLimit,
  extractClientIp,
  getRateLimitStatus,
  RATE_LIMIT,
} from '@/middleware/rate-limit';
import type { NextRequest } from 'next/server';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);

export function OPTIONS(): Response {
  return createApiOptionsResponse();
}

function buildExportHeaders(
  req: NextRequest,
  type: string,
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  const rateLimitStatus = getRateLimitStatus(extractClientIp(req));

  return {
    ...API_CORS_HEADERS,
    ...API_NO_STORE_HEADERS,
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${type}.csv"`,
    Vary: 'Accept-Encoding',
    'X-RateLimit-Limit': String(RATE_LIMIT),
    'X-RateLimit-Remaining': String(rateLimitStatus.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateLimitStatus.reset / 1000)),
    ...extraHeaders,
  };
}

/**
 * Export standings, recent games, or search results as an RFC 4180-compliant CSV attachment.
 *
 * Depending on the route `type` parameter, this handler returns:
 * - "standings": current 30-team standings,
 * - "games": 100 most recent games,
 * - "search": results for the `q` query parameter (trimmed).
 *
 * The handler enforces rate limiting, returns 400 for an invalid `type`, and will gzip the CSV when the client accepts gzip and the CSV exceeds 1024 bytes. Responses include `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="{type}.csv"`; gzipped responses also include `Content-Encoding: gzip` and `Vary: Accept-Encoding`.
 *
 * @param req - Next.js request object; used to read the `q` search query for `type = "search"` and request headers for compression support
 * @param params - Promise resolving to route parameters with `type` set to "standings" | "games" | "search"
 * @returns A Response whose body is the exported CSV (plain string or gzipped bytes) with appropriate CSV and content-disposition headers
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
): Promise<Response> {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { type } = await params;
    if (type !== 'standings' && type !== 'games' && type !== 'search') {
      return createApiErrorResponse(req, 400, 'invalid_export_type', 'Invalid export type.');
    }

    let rows: DbRows = [];

    if (type === 'standings') rows = castToDbRows(getHomeStandings(30));
    if (type === 'games') rows = castToDbRows(getRecentGames(100));
    if (type === 'search') {
      const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
      rows = castToDbRows(
        searchEntities(query).map(result => ({
          type: result.type,
          id: result.id,
          label: result.label,
          description: result.description,
          href: result.href,
        }))
      );
    }

    const csv = convertRowsToCsv(rows);
    const acceptEncoding = req.headers.get('accept-encoding') ?? '';
    const supportsGzip = acceptEncoding.includes('gzip');

    if (supportsGzip && csv.length > 1024) {
      const compressed = await gzipAsync(Buffer.from(csv, 'utf-8'));
      return new Response(compressed, {
        headers: buildExportHeaders(req, type, { 'Content-Encoding': 'gzip' }),
      });
    }

    return new Response(csv, {
      headers: buildExportHeaders(req, type),
    });
  } catch (error) {
    const routeParams = await params;
    logApiError('export', error, {
      exportType: routeParams.type,
      query: req.nextUrl.searchParams.get('q')?.trim() ?? null,
    });
    return createApiErrorResponse(
      req,
      500,
      'export_failed',
      'CSV export is temporarily unavailable.'
    );
  }
}
