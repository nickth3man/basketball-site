'use client';

import type { JSX } from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface PlayerErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PlayerErrorPage({ error, reset }: PlayerErrorPageProps): JSX.Element {
  useEffect(() => {
    console.error('[Player Page Error]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="mb-4 text-4xl font-bold text-heading">Player Not Available</h1>
      <p className="mb-8 text-muted">
        We encountered an error while loading this player. Please try again.
      </p>
      {error.digest != null && error.digest.length > 0 ? (
        <p className="mb-4 font-mono text-xs text-muted">Error ID: {error.digest}</p>
      ) : null}
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
