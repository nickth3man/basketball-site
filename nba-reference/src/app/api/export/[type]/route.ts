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

import { convertRowsToCsv, castToDbRows } from '@/lib/csv';
import { getHomeStandings, getRecentGames } from '@/lib/query/home';
import { searchEntities } from '@/lib/query/search';
import type { DbRows } from '@/lib/types';
import { checkRateLimit } from '@/middleware/rate-limit';
import type { NextRequest } from 'next/server';
import { gzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);

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
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
): Promise<Response> {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const { type } = await params;
  if (type !== 'standings' && type !== 'games' && type !== 'search') {
    return new Response('Invalid export type', { status: 400 });
  }

  let rows: DbRows = [];

  if (type === 'standings') rows = castToDbRows(getHomeStandings(30));
  if (type === 'games') rows = castToDbRows(getRecentGames(100));
  if (type === 'search') {
    const query = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    rows = castToDbRows(searchEntities(query));
  }

  const csv = convertRowsToCsv(rows);
  const acceptEncoding = req.headers.get('accept-encoding') ?? '';
  const supportsGzip = acceptEncoding.includes('gzip');

  if (supportsGzip && csv.length > 1024) {
    const compressed = await gzipAsync(Buffer.from(csv, 'utf-8'));
    return new Response(compressed, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Encoding': 'gzip',
        'Content-Disposition': `attachment; filename="${type}.csv"`,
        Vary: 'Accept-Encoding',
      },
    });
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}.csv"`,
    },
  });
}
