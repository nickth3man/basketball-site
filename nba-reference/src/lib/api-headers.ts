export const API_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Accept-Encoding',
} as const;

export const API_NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
} as const;
