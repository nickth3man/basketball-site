import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function SeasonLoading(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-1 h-4 w-48" />
      <Skeleton className="mb-3 h-9 w-48" />

      <section className="mb-8 surface-pedestal p-4">
        <Skeleton className="mb-2 h-6 w-32" />
        <div className="grid gap-2 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20" />
          ))}
        </div>
      </section>

      <section className="mb-8 panel-paper p-4">
        <Skeleton className="mb-3 h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-40" />
        <Skeleton className="h-64 w-full panel-paper" />
      </section>

      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i} className="mb-8">
          <Skeleton className="mb-2 h-7 w-36" />
          <Skeleton className="h-64 w-full panel-paper" />
        </section>
      ))}

      <section>
        <Skeleton className="mb-2 h-7 w-32" />
        <Skeleton className="h-64 w-full panel-paper" />
      </section>
    </main>
  );
}
