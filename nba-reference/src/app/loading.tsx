import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomeLoading(): JSX.Element {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6">
      <Skeleton className="mb-4 h-10 w-96" />
      <Skeleton className="mb-8 h-6 w-64" />

      <div className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr]">
        <Skeleton className="h-10 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>

      <Skeleton className="mb-6 h-16 w-full" />

      <section className="mb-8 panel-paper p-3">
        <Skeleton className="mb-3 h-7 w-48" />
        <Skeleton className="h-96 w-full" />
      </section>

      <section className="panel-paper p-3">
        <Skeleton className="mb-3 h-7 w-36" />
        <Skeleton className="h-64 w-full" />
      </section>
    </main>
  );
}
