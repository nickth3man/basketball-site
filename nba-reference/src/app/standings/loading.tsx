import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function StandingsLoading(): JSX.Element {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <Skeleton className="mb-1 h-9 w-48" />
      <Skeleton className="mb-5 h-5 w-72" />

      <section className="mb-6 panel-paper p-4">
        <form className="flex items-center gap-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </form>
        <Skeleton className="mt-2 h-4 w-48" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel-paper p-4">
          <Skeleton className="mb-3 h-6 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </section>

        <section className="panel-paper p-4">
          <Skeleton className="mb-3 h-6 w-44" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
