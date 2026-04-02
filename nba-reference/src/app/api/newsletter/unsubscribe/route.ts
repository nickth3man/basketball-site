/**
 * @fileoverview Newsletter unsubscribe API endpoint.
 *
 * Handles one-click unsubscribe links embedded in newsletter emails.
 * Accepts POST requests with a JSON body containing the per-subscriber
 * unsubscribe token and marks the subscriber as unsubscribed.
 *
 * @module @/app/api/newsletter/unsubscribe/route
 */

import {
  createApiErrorResponse,
  createApiJsonResponse,
  logApiError,
  parseApiJsonBody,
} from '@/lib/api-response';
import { unsubscribeByToken } from '@/lib/newsletter-db';
import { API_NO_STORE_HEADERS, WRITE_CORS_HEADERS } from '@/lib/api-headers';
import type { NextRequest } from 'next/server';

export function OPTIONS(req: NextRequest): Response {
  const origin = req.headers.get('origin');
  const corsHeaders: Record<string, string> = {
    ...WRITE_CORS_HEADERS,
    ...API_NO_STORE_HEADERS,
  };
  if (origin != null && origin.length > 0) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Unsubscribe a recipient using the token from their email footer link.
 *
 * Expects a JSON body with a `token` string field.
 *
 * @returns JSON `{ status: "unsubscribed" }` on success, or an error response.
 */
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const parsedBody = await parseApiJsonBody(req);
    if (!parsedBody.ok) {
      return parsedBody.response;
    }

    const body =
      typeof parsedBody.body === 'object' && parsedBody.body !== null
        ? (parsedBody.body as Record<string, unknown>)
        : {};

    const token = typeof body['token'] === 'string' ? body['token'].trim() : '';
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
