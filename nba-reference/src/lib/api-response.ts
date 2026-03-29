import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { API_CORS_HEADERS, API_NO_STORE_HEADERS } from '@/lib/api-headers';
import { logError } from '@/lib/logger';
import { extractClientIp, getRateLimitStatus, RATE_LIMIT } from '@/middleware/rate-limit';

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

function buildRateLimitHeaders(req: NextRequest): Record<string, string> {
  const rateLimitStatus = getRateLimitStatus(extractClientIp(req));
  return {
    'X-RateLimit-Limit': String(RATE_LIMIT),
    'X-RateLimit-Remaining': String(rateLimitStatus.remaining),
    'X-RateLimit-Reset': String(Math.ceil(rateLimitStatus.reset / 1000)),
  };
}

export function createApiOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      ...API_CORS_HEADERS,
      ...API_NO_STORE_HEADERS,
    },
  });
}

export function createApiJsonResponse<T>(
  req: NextRequest,
  body: T,
  init?: { headers?: Record<string, string>; status?: number }
): NextResponse<T> {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      ...API_CORS_HEADERS,
      ...API_NO_STORE_HEADERS,
      ...buildRateLimitHeaders(req),
      ...init?.headers,
    },
  });
}

export function createApiErrorResponse(
  req: NextRequest,
  status: number,
  code: string,
  message: string
): NextResponse<ApiErrorResponse> {
  return createApiJsonResponse(
    req,
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export function logApiError(
  route: string,
  error: unknown,
  metadata: Record<string, string | number | boolean | null | undefined> = {}
): void {
  logError(`api:${route} failed`, {
    ...metadata,
    errorName: error instanceof Error ? error.name : 'UnknownError',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}
