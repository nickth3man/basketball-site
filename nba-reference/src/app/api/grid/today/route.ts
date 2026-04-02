/**
 * @fileoverview Grid game API — returns today's puzzle.
 *
 * GET /api/grid/today
 * Returns the puzzle for today's ET date. If no puzzle is curated for today,
 * returns the most recent past puzzle. Puzzle data is served from static
 * TypeScript definitions and cached aggressively (1 hour).
 *
 * @module @/app/api/grid/today/route
 */

import {
  createApiErrorResponse,
  createApiJsonResponse,
  createApiOptionsResponse,
  logApiError,
} from '@/lib/api-response';
import { getTodayPuzzle } from '@/lib/puzzles/data';
import type { TodayPuzzleResponse } from '@/lib/puzzles/types';
import type { NextRequest } from 'next/server';

/** Returns today's ET date as a YYYY-MM-DD string */
function getTodayDateET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);
}

export function OPTIONS(): Response {
  return createApiOptionsResponse();
}

/**
 * Handle GET requests to /api/grid/today.
 *
 * @param req - Incoming Next.js request
 * @returns Today's puzzle or a 404 if no puzzles are available
 */
export function GET(req: NextRequest): Response {
  try {
    const today = getTodayDateET();
    const puzzle = getTodayPuzzle(today);

    if (puzzle === undefined) {
      return createApiErrorResponse(req, 404, 'no_puzzle', 'No puzzle available for today.');
    }

    const body: TodayPuzzleResponse = { puzzle };

    return createApiJsonResponse(req, body, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    logApiError('grid/today', error);
    return createApiErrorResponse(req, 500, 'server_error', "Could not load today's puzzle.");
  }
}
