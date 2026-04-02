/**
 * @fileoverview Grid game API — validates a player answer for a specific cell.
 *
 * POST /api/grid/answer
 * Accepts a JSON body with `puzzleId`, `rowIndex`, `colIndex`, and `brefId`.
 * Returns whether the player satisfies both the row and column criteria for
 * the indicated cell.
 *
 * @module @/app/api/grid/answer/route
 */

import {
  createApiErrorResponse,
  createApiJsonResponse,
  createApiOptionsResponse,
  logApiError,
  parseApiJsonBody,
} from '@/lib/api-response';
import { getPuzzleByDate } from '@/lib/puzzles/data';
import type { AnswerRequest, AnswerResponse } from '@/lib/puzzles/types';
import { getGridPlayerById, validatePlayerCriteria } from '@/lib/queries/grid';
import type { NextRequest } from 'next/server';

export function OPTIONS(_req: NextRequest): Response {
  const res = createApiOptionsResponse();
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return res;
}

/**
 * Handle POST requests to /api/grid/answer.
 *
 * Validates whether the supplied player (`brefId`) satisfies both the row and
 * column criteria for the given cell in the specified puzzle.
 *
 * @param req - Incoming Next.js request with JSON body matching `AnswerRequest`
 * @returns `AnswerResponse` indicating correctness and player details
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const parsedBody = await parseApiJsonBody(req);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const body = parsedBody.body;

    if (!isAnswerRequest(body)) {
      return createApiErrorResponse(
        req,
        400,
        'invalid_body',
        'Request body must include puzzleId, rowIndex, colIndex, and brefId.'
      );
    }

    const { puzzleId, rowIndex, colIndex, brefId } = body;

    const puzzle = getPuzzleByDate(puzzleId);
    if (puzzle === undefined) {
      return createApiErrorResponse(req, 404, 'puzzle_not_found', 'Puzzle not found.');
    }

    const rowCriteria = puzzle.rows[rowIndex];
    const colCriteria = puzzle.cols[colIndex];

    if (rowCriteria === undefined || colCriteria === undefined) {
      return createApiErrorResponse(req, 400, 'invalid_cell', 'Invalid row or column index.');
    }

    const player = getGridPlayerById(brefId);
    if (player === undefined) {
      const response: AnswerResponse = {
        correct: false,
        brefId: null,
        fullName: null,
        message: 'Player not found.',
      };
      return createApiJsonResponse(req, response);
    }

    const rowValid = validatePlayerCriteria(brefId, rowCriteria);
    const colValid = validatePlayerCriteria(brefId, colCriteria);
    const correct = rowValid && colValid;

    const response: AnswerResponse = {
      correct,
      brefId: player.bref_id,
      fullName: player.full_name,
      message: correct
        ? `${player.full_name} is correct!`
        : `${player.full_name} does not satisfy both criteria.`,
    };

    return createApiJsonResponse(req, response);
  } catch (error) {
    logApiError('grid/answer', error);
    return createApiErrorResponse(req, 500, 'server_error', 'Could not validate answer.');
  }
}

/** Type guard to validate the shape of the incoming request body */
function isAnswerRequest(value: unknown): value is AnswerRequest {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj['puzzleId'] === 'string' &&
    typeof obj['rowIndex'] === 'number' &&
    obj['rowIndex'] >= 0 &&
    Number.isInteger(obj['rowIndex']) &&
    typeof obj['colIndex'] === 'number' &&
    obj['colIndex'] >= 0 &&
    Number.isInteger(obj['colIndex']) &&
    typeof obj['brefId'] === 'string'
  );
}
