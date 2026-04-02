/**
 * @fileoverview Newsletter subscribe API endpoint.
 *
 * Accepts POST requests with an `email` body field, validates the address,
 * persists the subscriber in the newsletter database, and returns a JSON
 * confirmation. Idempotent: re-subscribing an already-active address returns
 * 200 with `"status": "already_subscribed"`.
 *
 * @module @/app/api/newsletter/subscribe/route
 */

import {
  createApiErrorResponse,
  createApiJsonResponse,
  createApiOptionsResponse,
  logApiError,
  parseApiJsonBody,
} from '@/lib/api-response';
import { addSubscriber } from '@/lib/newsletter-db';
import type { NextRequest } from 'next/server';

/** RFC 5322–inspired email regex — good enough for server-side pre-validation. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Maximum allowed byte length for an email field value. */
const MAX_EMAIL_LENGTH = 254;

export function OPTIONS(): Response {
  return createApiOptionsResponse();
}

/**
 * Subscribe an email address to the NBA daily newsletter.
 *
 * Expects a JSON body with an `email` string field and an optional `source`
 * string and `preference` (`"daily"` | `"weekly"`).
 *
 * @returns JSON response with `status` (`"subscribed"` | `"already_subscribed"`)
 *          and the subscriber's `unsubscribe_token`.
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

    const rawEmail = typeof body['email'] === 'string' ? body['email'].trim().toLowerCase() : '';
    if (rawEmail.length === 0) {
      return createApiErrorResponse(req, 400, 'missing_email', 'Email address is required.');
    }
    if (rawEmail.length > MAX_EMAIL_LENGTH) {
      return createApiErrorResponse(req, 400, 'invalid_email', 'Email address is too long.');
    }
    if (!EMAIL_RE.test(rawEmail)) {
      return createApiErrorResponse(
        req,
        400,
        'invalid_email',
        'Please enter a valid email address.'
      );
    }

    const source =
      typeof body['source'] === 'string' && body['source'].trim().length > 0
        ? body['source'].trim().slice(0, 50)
        : 'web';

    const rawPref = typeof body['preference'] === 'string' ? body['preference'].trim() : '';
    const preference: 'daily' | 'weekly' = rawPref === 'weekly' ? 'weekly' : 'daily';

    const result = addSubscriber(rawEmail, source, preference);

    return createApiJsonResponse(req, {
      status: result.isNew ? 'subscribed' : 'already_subscribed',
      unsubscribe_token: result.subscriber.unsubscribe_token,
    });
  } catch (error) {
    logApiError('newsletter/subscribe', error, {
      email: undefined,
    });
    return createApiErrorResponse(
      req,
      500,
      'subscribe_failed',
      'Newsletter subscription is temporarily unavailable.'
    );
  }
}
