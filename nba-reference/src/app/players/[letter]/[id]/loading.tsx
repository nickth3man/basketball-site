import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayerDetailLoading(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-1 h-4 w-48" />

      <div className="mb-4 flex items-start gap-6">
        <Skeleton className="h-32 w-32 flex-shrink-0 rounded" />
        <div className="flex-1">
          <Skeleton className="mb-2 h-8 w-64" />
          <div className="mb-3 grid gap-2 sm:grid-cols-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-22" />
          </div>
          <div className="grid gap-2 sm:grid-cols-5 lg:grid-cols-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16" />
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-max border border-line-mid bg-white p-3 lg:sticky lg:top-3">
          <Skeleton className="mb-2 h-4 w-24" />
          <div className="space-y-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        </aside>

        <div className="space-y-8">
          {Array.from({ length: 4 }).map((_, sectionIndex) => (
            <section key={sectionIndex}>
              <Skeleton className="mb-2 h-7 w-32" />
              <Skeleton className="h-64 w-full panel-paper" />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
