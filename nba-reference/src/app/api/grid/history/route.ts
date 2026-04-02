/**
 * @fileoverview Grid game API — returns the list of available past puzzles.
 *
 * GET /api/grid/history
 * Returns all puzzles that are on or before today's ET date, ordered newest-first.
 *
 * @module @/app/api/grid/history/route
 */

import {
  createApiErrorResponse,
  createApiJsonResponse,
  createApiOptionsResponse,
  logApiError,
} from '@/lib/api-response';
import { getAvailablePuzzles } from '@/lib/puzzles/data';
import type { HistoryResponse } from '@/lib/puzzles/types';
import type { NextRequest } from 'next/server';

/** Returns today's ET date as a YYYY-MM-DD string */
function getTodayDateET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' }).slice(0, 10);
}

export function OPTIONS(): Response {
  return createApiOptionsResponse();
}

/**
 * Handle GET requests to /api/grid/history.
 *
 * @param req - Incoming Next.js request
 * @returns All available puzzles ordered newest-first
 */
export function GET(req: NextRequest): Response {
  try {
    const today = getTodayDateET();
    const puzzles = getAvailablePuzzles(today);

    const body: HistoryResponse = { puzzles };

    return createApiJsonResponse(req, body, {
      headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    logApiError('grid/history', error);
    return createApiErrorResponse(req, 500, 'server_error', 'Could not load puzzle history.');
  }
}
