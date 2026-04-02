/**
 * @fileoverview Newsletter unsubscribe API endpoint.
 *
 * Handles one-click unsubscribe links embedded in newsletter emails.
 * Accepts GET requests with a `token` query parameter (the per-subscriber
 * unsubscribe token) and marks the subscriber as unsubscribed.
 *
 * @module @/app/api/newsletter/unsubscribe/route
 */

import {
  createApiErrorResponse,
  createApiJsonResponse,
  createApiOptionsResponse,
  logApiError,
} from '@/lib/api-response';
import { unsubscribeByToken } from '@/lib/newsletter-db';
import { checkRateLimit } from '@/middleware/rate-limit';
import type { NextRequest } from 'next/server';

export function OPTIONS(): Response {
  return createApiOptionsResponse();
}

/**
 * Unsubscribe a recipient using the token from their email footer link.
 *
 * Usage: `GET /api/newsletter/unsubscribe?token=<hex-token>`
 *
 * @returns JSON `{ status: "unsubscribed" }` on success, or an error response.
 */
export function GET(req: NextRequest): Response {
  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const token = req.nextUrl.searchParams.get('token')?.trim() ?? '';
    if (token.length === 0) {
      return createApiErrorResponse(req, 400, 'missing_token', 'Unsubscribe token is required.');
    }

    const success = unsubscribeByToken(token);
    if (!success) {
      return createApiErrorResponse(
        req,
        404,
        'token_not_found',
        'Unsubscribe token not found or already used.'
      );
    }

    return createApiJsonResponse(req, { status: 'unsubscribed' });
  } catch (error) {
    logApiError('newsletter/unsubscribe', error, {});
    return createApiErrorResponse(
      req,
      500,
      'unsubscribe_failed',
      'Unsubscribe is temporarily unavailable. Please try again.'
    );
  }
}
