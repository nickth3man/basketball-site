const ALLOWED_ORIGINS = ['https://nba-reference.com', 'http://localhost:3000'] as const;

export const READ_ONLY_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Encoding',
} as const;

export const RESTRICTED_CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Encoding',
  Vary: 'Origin',
} as const;

/**
 * Return CORS headers for a given request origin.
 * If the origin is in the allowlist, return restricted headers;
 * otherwise return an empty object (no CORS access).
 */
export function getRestrictedCorsHeaders(origin: string | null): Record<string, string> {
  if (origin != null && (ALLOWED_ORIGINS as readonly string[]).includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Encoding',
      Vary: 'Origin',
    };
  }
  return {};
}

/** Backwards-compatible alias — prefer READ_ONLY_CORS_HEADERS for new code. */
export const API_CORS_HEADERS = READ_ONLY_CORS_HEADERS;

/** Restricted CORS headers for write endpoints (subscribe, unsubscribe). */
export const WRITE_CORS_HEADERS = RESTRICTED_CORS_HEADERS;

export const API_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const;
