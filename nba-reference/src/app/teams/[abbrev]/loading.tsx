import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function TeamLoading(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-1 h-4 w-32" />

      <section className="mb-5 border border-line bg-paper-soft p-4">
        <Skeleton className="mb-2 h-4 w-32" />
        <Skeleton className="mb-2 h-8 w-48" />

        <div className="mb-3 grid gap-2 text-sm md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-32" />
          ))}
        </div>

        <div className="grid gap-2 border border-line-soft bg-white p-3 sm:grid-cols-5 lg:grid-cols-10">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-16" />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20" />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-max border border-line-mid bg-white p-3 lg:sticky lg:top-3">
          <Skeleton className="mb-2 h-4 w-24" />
          <div className="space-y-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full" />
            ))}
          </div>
        </aside>

        <div className="space-y-8">
          {Array.from({ length: 6 }).map((_, sectionIndex) => (
            <section key={sectionIndex}>
              <Skeleton className="mb-2 h-7 w-40" />
              <Skeleton className="h-48 w-full panel-paper" />
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
