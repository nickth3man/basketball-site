import type { NextRequest } from 'next/server';

export function logRequest(req: NextRequest): void {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.nextUrl.pathname;
  console.log(`[${timestamp}] ${method} ${url}`);
}
