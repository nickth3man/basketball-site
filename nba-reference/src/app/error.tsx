'use client';

import type { JSX } from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps): JSX.Element {
  useEffect(() => {
    console.error('[Page Error]', {
      message: error.message,
      digest: error.digest,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 inscription-title text-4xl">Something went wrong</h1>
      <p className="mb-8 text-muted">
        We encountered an error while loading this page. Please try again.
      </p>
      {error.digest != null && error.digest.length > 0 ? (
        <p className="mb-4 font-mono text-xs text-muted">Error ID: {error.digest}</p>
      ) : null}
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
