import type { JSX } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="mb-4 text-4xl font-bold text-heading">Page Not Found</h1>
      <p className="mb-8 text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex justify-center gap-4">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/search">
          <Button variant="muted">Search</Button>
        </Link>
      </div>
    </main>
  );
}
