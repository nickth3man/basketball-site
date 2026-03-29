import type { NextRequest } from 'next/server';
import { logInfo } from '@/lib/logger';

export function logRequest(req: NextRequest): void {
  logInfo(`${req.method} ${req.nextUrl.pathname}`, {
    method: req.method,
    url: req.nextUrl.pathname,
    userAgent: req.headers.get('user-agent')?.slice(0, 100),
  });
}
