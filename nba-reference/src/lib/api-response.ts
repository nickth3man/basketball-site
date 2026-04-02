import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { API_CORS_HEADERS, API_NO_STORE_HEADERS } from '@/lib/api-headers';
import { logError } from '@/lib/logger';

interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export type ParsedApiJsonBodyResult =
  | {
      ok: true;
      body: unknown;
    }
  | {
      ok: false;
      response: NextResponse<ApiErrorResponse>;
    };

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
  _req: NextRequest,
  body: T,
  init?: { headers?: Record<string, string>; status?: number }
): NextResponse<T> {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      ...API_CORS_HEADERS,
      ...API_NO_STORE_HEADERS,
      ...init?.headers,
    },
  });
}

export function createApiErrorResponse(
  _req: NextRequest,
  status: number,
  code: string,
  message: string
): NextResponse<ApiErrorResponse> {
  return createApiJsonResponse(
    _req,
    {
      error: {
        code,
        message,
      },
    },
    { status }
  );
}

export async function parseApiJsonBody(
  req: NextRequest,
  invalidJsonMessage = 'Request body must be valid JSON.'
): Promise<ParsedApiJsonBodyResult> {
  try {
    const body: unknown = await req.json();
    return { ok: true, body };
  } catch {
    return {
      ok: false,
      response: createApiErrorResponse(req, 400, 'invalid_json', invalidJsonMessage),
    };
  }
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
