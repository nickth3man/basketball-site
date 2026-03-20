import type { JSX } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function LeadersLoading(): JSX.Element {
  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Skeleton className="mb-1 h-9 w-24" />
      <Skeleton className="mb-5 h-5 w-96" />

      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i} className="mb-8">
          <Skeleton className="mb-2 h-7 w-64" />
          <Skeleton className="h-64 w-full panel-paper" />
        </section>
      ))}

      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i} className="mb-8">
          <Skeleton className="mb-2 h-7 w-48" />
          <Skeleton className="h-64 w-full panel-paper" />
        </section>
      ))}

      <section className="mt-8">
        <Skeleton className="mb-2 h-7 w-48" />
        <Skeleton className="h-64 w-full panel-paper" />
      </section>
    </main>
  );
}
