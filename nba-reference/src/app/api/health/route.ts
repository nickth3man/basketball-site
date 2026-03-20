import type { NextResponse } from 'next/server';
import { NextResponse as NR } from 'next/server';
import { getDb } from '@/lib/db';

export function GET(): NextResponse {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();

    return NR.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (_error) {
    return NR.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
