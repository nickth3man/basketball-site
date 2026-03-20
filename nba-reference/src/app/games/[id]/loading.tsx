import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function GameLoading(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-1 h-4 w-48" />

      <Skeleton className="mb-2 h-8 w-80" />
      <Skeleton className="mb-4 h-5 w-64" />

      <section className="mb-6 panel-paper p-4">
        <Skeleton className="mb-3 h-6 w-36" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32" />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-40" />
        <Skeleton className="h-32 w-full panel-paper" />
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-36" />
        <Skeleton className="h-32 w-full panel-paper" />
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-28" />
        <Skeleton className="h-24 w-full panel-paper" />
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-64 w-full panel-paper" />
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-64 w-full panel-paper" />
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-40" />
        <Skeleton className="h-48 w-full panel-paper" />
      </section>

      <section className="mb-8">
        <Skeleton className="mb-2 h-7 w-40" />
        <Skeleton className="h-48 w-full panel-paper" />
      </section>

      <section>
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-96 w-full panel-paper" />
      </section>
    </main>
  );
}
