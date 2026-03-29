import type { JSX } from 'react';
import Link from 'next/link';
import { buttonStyles } from '@/components/ui/button';

export default function NotFoundPage(): JSX.Element {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="mb-4 inscription-title text-4xl">Page Not Found</h1>
      <p className="mb-10 text-muted">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/" className={buttonStyles({ variant: 'heroCta', size: 'lg' })}>
          Go Home
        </Link>
        <Link href="/search" className={buttonStyles({ variant: 'secondary', size: 'lg' })}>
          Search
        </Link>
      </div>
    </main>
  );
}
